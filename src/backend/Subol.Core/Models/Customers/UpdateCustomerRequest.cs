namespace Subol.Core.Models.Customers;

public class UpdateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UpdateLocationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AddLocationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}