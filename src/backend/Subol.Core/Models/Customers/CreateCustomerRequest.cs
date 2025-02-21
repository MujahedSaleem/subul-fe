namespace Subol.Core.Models.Customers;

public class CreateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public List<CreateLocationRequest> Locations { get; set; } = new();
}

public class CreateLocationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}