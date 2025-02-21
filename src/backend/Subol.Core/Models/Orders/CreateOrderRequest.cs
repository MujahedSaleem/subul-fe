namespace Subol.Core.Models.Orders;

public class CreateOrderRequest
{
    public int CustomerId { get; set; }
    public string? LocationId { get; set; }
    public string? DistributorId { get; set; }
    public decimal Cost { get; set; }
}