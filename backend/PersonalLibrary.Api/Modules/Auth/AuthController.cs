using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Auth.Dtos;

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
        var (ok, error, token) = await _service.LoginAsync(dto);
        if (!ok) return Unauthorized(new { message = error });

        return Ok(new AuthResponseDto(token!));
    }
}