using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Subol.Core.Interfaces;
using Subol.Core.Models.Orders;

namespace Subol.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll([FromQuery] OrderFilter? filter)
    {
        var orders = await _orderService.GetAllAsync(filter);
        return Ok(orders);
    }

    [HttpGet("distributor/{distributorId}")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetByDistributor(string distributorId, [FromQuery] OrderFilter? filter)
    {
        var orders = await _orderService.GetByDistributorAsync(distributorId, filter);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        try
        {
            var order = await _orderService.GetByIdAsync(id);
            return Ok(order);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest request)
    {
        var order = await _orderService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OrderDto>> Update(int id, UpdateOrderRequest request)
    {
        try
        {
            var order = await _orderService.UpdateAsync(id, request);
            return Ok(order);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult<OrderDto>> Confirm(int id, ConfirmOrderRequest request)
    {
        try
        {
            var order = await _orderService.ConfirmAsync(id, request);
            return Ok(order);
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
            await _orderService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}