namespace Subol.Core.Models.Orders;

public class OrderFilter
{
    public string? Status { get; set; }
    public string? DistributorId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}