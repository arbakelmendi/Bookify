using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Modules.Friends;
using PersonalLibrary.Api.Modules.Users.Dtos;
using System.Security.Claims;

namespace PersonalLibrary.Api.Modules.Users;

[ApiController]
[Route("api/[controller]")]
[Authorize] // ✅ all endpoints require login (perveç admin actions që kanë extra role)
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ Used by AddFriendDialog
    // GET /api/Users/search?q=olt
    [HttpGet("search")]
    public async Task<ActionResult<List<UserSearchResultDto>>> Search([FromQuery] string q)
    {
        var me = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        q = (q ?? "").Trim();
        if (q.Length < 2) return Ok(new List<UserSearchResultDto>());

        var qLower = q.ToLower();

        // 1) Users matching
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id != me &&
                       ((u.Email ?? "").ToLower().Contains(qLower) ||
                        (u.Username ?? "").ToLower().Contains(qLower)))
            .Select(u => new { u.Id, u.Email, u.Username })
            .Take(20)
            .ToListAsync();

        var ids = users.Select(x => x.Id).ToList();

        // 2) Friend requests between me and these users (Pending/Accepted/etc)
        var requests = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr =>
                (fr.SenderId == me && ids.Contains(fr.ReceiverId)) ||
                (fr.ReceiverId == me && ids.Contains(fr.SenderId))
            )
            .ToListAsync();

        // 3) Build DTO result
        var result = users.Select(u =>
        {
            var fr = requests.FirstOrDefault(x =>
                (x.SenderId == me && x.ReceiverId == u.Id) ||
                (x.ReceiverId == me && x.SenderId == u.Id)
            );

            if (fr == null)
                return new UserSearchResultDto(u.Id, u.Email ?? "", u.Username ?? "", "NONE", null);

            if (fr.Status == FriendRequestStatuses.Accepted)
                return new UserSearchResultDto(u.Id, u.Email ?? "", u.Username ?? "", "FRIEND", fr.Id);

            if (fr.Status == FriendRequestStatuses.Pending && fr.ReceiverId == me)
                return new UserSearchResultDto(u.Id, u.Email ?? "", u.Username ?? "", "INCOMING", fr.Id);

            if (fr.Status == FriendRequestStatuses.Pending && fr.SenderId == me)
                return new UserSearchResultDto(u.Id, u.Email ?? "", u.Username ?? "", "OUTGOING", fr.Id);

            return new UserSearchResultDto(u.Id, u.Email ?? "", u.Username ?? "", "NONE", null);
        }).ToList();

        return Ok(result);
    }

    // Admin only: list all users
    // GET /api/Users
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new UserDto(u.Id, u.Email, u.Username, u.Role))
            .ToListAsync();

        return Ok(users);
    }

    // Authenticated: get user by id
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
