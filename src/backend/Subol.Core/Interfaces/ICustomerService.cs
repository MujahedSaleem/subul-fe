using Subol.Core.Models.Customers;

namespace Subol.Core.Interfaces;

public interface ICustomerService
{
    Task<CustomerDto> GetByIdAsync(int id);
    Task<IEnumerable<CustomerDto>> GetAllAsync();
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request);
    Task<CustomerDto> UpdateAsync(int id, UpdateCustomerRequest request);
    Task DeleteAsync(int id);
    Task<CustomerDto> AddLocationAsync(int customerId, AddLocationRequest request);
    Task<CustomerDto> UpdateLocationAsync(int customerId, int locationId, UpdateLocationRequest request);
    Task DeleteLocationAsync(int customerId, int locationId);
}