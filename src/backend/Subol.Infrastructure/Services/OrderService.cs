using Microsoft.EntityFrameworkCore;
using Subol.Core.Entities;
using Subol.Core.Interfaces;
using Subol.Core.Models.Orders;
using Subol.Infrastructure.Data;

namespace Subol.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;

    public OrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto> GetByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Distributor)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {id} not found");
        }

        return MapToDto(order);
    }

    public async Task<IEnumerable<OrderDto>> GetAllAsync(OrderFilter? filter = null)
    {
        var query = _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Distributor)
            .AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(o => o.Status.ToString() == filter.Status);
            }

            if (!string.IsNullOrEmpty(filter.DistributorId))
            {
                query = query.Where(o => o.DistributorId == filter.DistributorId);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(o => o.ConfirmedAt >= filter.FromDate);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(o => o.ConfirmedAt <= filter.ToDate);
            }
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToDto);
    }

    public async Task<IEnumerable<OrderDto>> GetByDistributorAsync(string distributorId, OrderFilter? filter = null)
    {
        var query = _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Distributor)
            .Where(o => o.DistributorId == distributorId)
            .AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(o => o.Status.ToString() == filter.Status);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(o => o.ConfirmedAt >= filter.FromDate);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(o => o.ConfirmedAt <= filter.ToDate);
            }
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToDto);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request)
    {
        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            CustomerId = request.CustomerId,
            LocationId = request.LocationId,
            DistributorId = request.DistributorId,
            Cost = request.Cost,
            Status = OrderStatus.New
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(order.Id);
    }

    public async Task<OrderDto> UpdateAsync(int id, UpdateOrderRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {id} not found");
        }

        order.CustomerId = request.CustomerId;
        order.LocationId = request.LocationId;
        order.DistributorId = request.DistributorId;
        order.Cost = request.Cost;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(order.Id);
    }

    public async Task<OrderDto> ConfirmAsync(int id, ConfirmOrderRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {id} not found");
        }

        order.LocationId = request.LocationId;
        order.Status = OrderStatus.Confirmed;
        order.ConfirmedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(order.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {id} not found");
        }

        if (order.Status == OrderStatus.Confirmed)
        {
            throw new InvalidOperationException("Cannot delete a confirmed order");
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
    }

    private static string GenerateOrderNumber()
    {
        return $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}";
    }

    private static OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Customer = new CustomerInfo
            {
                Id = order.Customer.Id,
                Name = order.Customer.Name,
                Phone = order.Customer.Phone
            },
            Location = order.LocationId != null ? new LocationInfo
            {
                Id = int.Parse(order.LocationId),
                Name = "Location Name", // TODO: Include location details in query
                Coordinates = "Coordinates" // TODO: Include location details in query
            } : null,
            Distributor = order.Distributor != null ? new DistributorInfo
            {
                Id = order.Distributor.Id,
                Name = $"{order.Distributor.FirstName} {order.Distributor.LastName}",
                Phone = order.Distributor.PhoneNumber ?? string.Empty
            } : null,
            Cost = order.Cost,
            Status = order.Status.ToString(),
            CreatedAt = order.CreatedAt,
            ConfirmedAt = order.ConfirmedAt
        };
    }
}