using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Subol.Core.Interfaces;
using Subol.Core.Models.Customers;

namespace Subol.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
    {
        var customers = await _customerService.GetAllAsync();
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        try
        {
            var customer = await _customerService.GetByIdAsync(id);
            return Ok(customer);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create(CreateCustomerRequest request)
    {
        var customer = await _customerService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, UpdateCustomerRequest request)
    {
        try
        {
            var customer = await _customerService.UpdateAsync(id, request);
            return Ok(customer);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _customerService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{customerId}/locations")]
    public async Task<ActionResult<CustomerDto>> AddLocation(int customerId, AddLocationRequest request)
    {
        try
        {
            var customer = await _customerService.AddLocationAsync(customerId, request);
            return Ok(customer);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{customerId}/locations/{locationId}")]
    public async Task<ActionResult<CustomerDto>> UpdateLocation(int customerId, int locationId, UpdateLocationRequest request)
    {
        try
        {
            var customer = await _customerService.UpdateLocationAsync(customerId, locationId, request);
            return Ok(customer);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{customerId}/locations/{locationId}")]
    public async Task<IActionResult> DeleteLocation(int customerId, int locationId)
    {
        try
        {
            await _customerService.DeleteLocationAsync(customerId, locationId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}