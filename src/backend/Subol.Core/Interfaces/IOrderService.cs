using Subol.Core.Models.Orders;

namespace Subol.Core.Interfaces;

public interface IOrderService
{
    Task<OrderDto> GetByIdAsync(int id);
    Task<IEnumerable<OrderDto>> GetAllAsync(OrderFilter? filter = null);
    Task<IEnumerable<OrderDto>> GetByDistributorAsync(string distributorId, OrderFilter? filter = null);
    Task<OrderDto> CreateAsync(CreateOrderRequest request);
    Task<OrderDto> UpdateAsync(int id, UpdateOrderRequest request);
    Task<OrderDto> ConfirmAsync(int id, ConfirmOrderRequest request);
    Task DeleteAsync(int id);
}