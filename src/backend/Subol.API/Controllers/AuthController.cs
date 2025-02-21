using Microsoft.AspNetCore.Mvc;
using Subol.Core.Interfaces;
using Subol.Core.Models.Auth;

namespace Subol.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResult>> RefreshToken([FromBody] string refreshToken)
    {
        var result = await _authService.RefreshTokenAsync(refreshToken);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> RevokeToken([FromBody] string userId)
    {
        var result = await _authService.RevokeTokenAsync(userId);
        if (!result)
        {
            return BadRequest();
        }

        return Ok();
    }
}