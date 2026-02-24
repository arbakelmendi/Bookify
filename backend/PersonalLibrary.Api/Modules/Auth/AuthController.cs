using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Modules.Auth.Dtos;
using PersonalLibrary.Api.Modules.Users.Dtos;

namespace PersonalLibrary.Api.Modules.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;
    private readonly AppDbContext _context;

    public AuthController(AuthService service, AppDbContext context)
    {
        _service = service;
        _context = context;
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
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null || email == null || username == null || role == null)
        {
            var guestUser = new UserDto(0, "guest@bookify.local", "guest", "user", null);
            return Ok(guestUser);
        }

        var parsedUserId = int.Parse(userId);
        var userBio = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == parsedUserId)
            .Select(u => u.Bio)
            .FirstOrDefaultAsync();

        var userDto = new UserDto(parsedUserId, email, username, role, userBio);
        return Ok(userDto);
    }
}
