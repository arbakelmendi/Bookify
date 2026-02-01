using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Auth.Dtos;
using PersonalLibrary.Api.Modules.Users.Dtos;

namespace PersonalLibrary.Api.Modules.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;

    public AuthController(AuthService service)
    {
        _service = service;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var (ok, error) = await _service.RegisterAsync(dto);
        if (!ok) return BadRequest(new { message = error });

        return Ok(new { message = "Registered successfully." });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var (ok, error, response) = await _service.LoginAsync(dto);
        if (!ok) return Unauthorized(new { message = error });

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null || email == null || username == null || role == null)
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        var userDto = new UserDto(int.Parse(userId), email, username, role);
        return Ok(userDto);
    }
}