using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Auth.Dtos;
using PersonalLibrary.Api.Modules.Users.Dtos;

namespace PersonalLibrary.Api.Modules.Auth;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<(bool ok, string error)> RegisterAsync(RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLower();
        var username = dto.Username.Trim();

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
        if (emailExists) return (false, "Email is already registered.");

        var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower());
        if (usernameExists) return (false, "Username is already taken.");

        var user = new User
        {
            Email = email,
            Username = username,
            Role = "user",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (true, "");
    }

    public async Task<(bool ok, string error, AuthResponseDto? response)> LoginAsync(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (user == null) return (false, "Invalid email or password.", null);

        var valid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!valid) return (false, "Invalid email or password.", null);

        var token = GenerateJwtToken(user);
        var userDto = new UserDto(user.Id, user.Email, user.Username, user.Role);
        var response = new AuthResponseDto(token, userDto);

        return (true, "", response);
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"];
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var expiresMinutes = int.Parse(_config["Jwt:ExpiresMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            // This is IMPORTANT for your other controllers (Friends/Reading) to read userId
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
