using Microsoft.EntityFrameworkCore;
using Subol.Core.Entities;
using Subol.Core.Interfaces;
using Subol.Core.Models.Customers;
using Subol.Infrastructure.Data;

namespace Subol.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;

    public CustomerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerDto> GetByIdAsync(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.Locations)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {id} not found");
        }

        return MapToDto(customer);
    }

    public async Task<IEnumerable<CustomerDto>> GetAllAsync()
    {
        var customers = await _context.Customers
            .Include(c => c.Locations)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return customers.Select(MapToDto);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            Name = request.Name,
            Phone = request.Phone,
            Locations = request.Locations.Select(l => new Location
            {
                Name = l.Name,
                Coordinates = l.Coordinates,
                Description = l.Description
            }).ToList()
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(int id, UpdateCustomerRequest request)
    {
        var customer = await _context.Customers
            .Include(c => c.Locations)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {id} not found");
        }

        customer.Name = request.Name;
        customer.Phone = request.Phone;
        customer.IsActive = request.IsActive;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task DeleteAsync(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {id} not found");
        }

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
    }

    public async Task<CustomerDto> AddLocationAsync(int customerId, AddLocationRequest request)
    {
        var customer = await _context.Customers
            .Include(c => c.Locations)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {customerId} not found");
        }

        var location = new Location
        {
            Name = request.Name,
            Coordinates = request.Coordinates,
            Description = request.Description
        };

        customer.Locations.Add(location);
        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateLocationAsync(int customerId, int locationId, UpdateLocationRequest request)
    {
        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == locationId && l.CustomerId == customerId);

        if (location == null)
        {
            throw new KeyNotFoundException($"Location with ID {locationId} not found for customer {customerId}");
        }

        location.Name = request.Name;
        location.Coordinates = request.Coordinates;
        location.Description = request.Description;

        await _context.SaveChangesAsync();

        var customer = await _context.Customers
            .Include(c => c.Locations)
            .FirstAsync(c => c.Id == customerId);

        return MapToDto(customer);
    }

    public async Task DeleteLocationAsync(int customerId, int locationId)
    {
        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == locationId && l.CustomerId == customerId);

        if (location == null)
        {
            throw new KeyNotFoundException($"Location with ID {locationId} not found for customer {customerId}");
        }

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
    }

    private static CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Phone = customer.Phone,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt,
            Locations = customer.Locations.Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Coordinates = l.Coordinates,
                Description = l.Description,
                CreatedAt = l.CreatedAt
            }).ToList()
        };
    }
}