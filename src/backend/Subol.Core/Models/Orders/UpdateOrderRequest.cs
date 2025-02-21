namespace Subol.Core.Models.Orders;

public class UpdateOrderRequest
{
    public int CustomerId { get; set; }
    public string? LocationId { get; set; }
    public string? DistributorId { get; set; }
    public decimal Cost { get; set; }
}

public class ConfirmOrderRequest
{
    public string? LocationId { get; set; }
    public string? Coordinates { get; set; }
}