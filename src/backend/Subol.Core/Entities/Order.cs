namespace Subol.Core.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string? LocationId { get; set; }
    public string? DistributorId { get; set; }
    public decimal Cost { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    
    public Customer Customer { get; set; } = null!;
    public User? Distributor { get; set; }
}