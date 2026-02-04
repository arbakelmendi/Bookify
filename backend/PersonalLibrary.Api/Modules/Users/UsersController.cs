using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Modules.Users.Dtos;

namespace PersonalLibrary.Api.Modules.Users;

[ApiController]
[Route("api/[controller]")]
[Authorize] // ✅ all endpoints require login
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ Used by AddFriendDialog: search by email or username
    // GET /api/Users/search?query=olt
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        query = (query ?? "").Trim();

        if (query.Length < 2)
            return Ok(new List<UserDto>());

        var qLower = query.ToLower();

        var users = await _context.Users
            .Where(u =>
                u.Email.ToLower().Contains(qLower) ||
                u.Username.ToLower().Contains(qLower)
            )
            .OrderBy(u => u.Username)
            .Take(10)
            .Select(u => new UserDto(u.Id, u.Email, u.Username, u.Role))
            .ToListAsync();

        return Ok(users);
    }

    // Admin only: list all users
    // GET /api/Users
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .Select(u => new UserDto(u.Id, u.Email, u.Username, u.Role))
            .ToListAsync();

        return Ok(users);
    }

    // Authenticated: get user by id (needed for profile/friends future)
    // GET /api/Users/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(new { message = "User not found." });

        return Ok(new UserDto(user.Id, user.Email, user.Username, user.Role));
    }

    // Admin only: update user
    // PUT /api/Users/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        var email = (dto.Email ?? "").Trim().ToLower();
        var username = (dto.Username ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username))
            return BadRequest(new { message = "Email and Username are required." });

        // basic uniqueness checks (optional but helpful)
        var emailTaken = await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == email);
        if (emailTaken) return BadRequest(new { message = "Email is already taken." });

        var usernameTaken = await _context.Users.AnyAsync(u => u.Id != id && u.Username.ToLower() == username.ToLower());
        if (usernameTaken) return BadRequest(new { message = "Username is already taken." });

        user.Email = email;
        user.Username = username;
        user.Role = dto.Role;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Admin only: delete user
    // DELETE /api/Users/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
