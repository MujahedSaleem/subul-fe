namespace Subol.Core.Models.Orders;

public class OrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public CustomerInfo Customer { get; set; } = null!;
    public LocationInfo? Location { get; set; }
    public DistributorInfo? Distributor { get; set; }
    public decimal Cost { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}

public class CustomerInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class LocationInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
}

public class DistributorInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}