using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Authors.Dtos;

namespace PersonalLibrary.Api.Modules.Authors;

public class AuthorsService
{
    private readonly AppDbContext _context;

    public AuthorsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuthorDto>> GetAllAsync()
        => await _context.Authors
            .Select(a => new AuthorDto(a.Id, a.Name))
            .ToListAsync();

    public async Task<AuthorDto?> GetByIdAsync(int id)
        => await _context.Authors
            .Where(a => a.Id == id)
            .Select(a => new AuthorDto(a.Id, a.Name))
            .FirstOrDefaultAsync();

    public async Task<AuthorDto> CreateAsync(CreateAuthorDto dto)
    {
        var author = new Author { Name = dto.Name };
        _context.Authors.Add(author);
        await _context.SaveChangesAsync();
        return new AuthorDto(author.Id, author.Name);
    }

    public async Task<bool> UpdateAsync(int id, CreateAuthorDto dto)
    {
        var author = await _context.Authors.FindAsync(id);
        if (author == null) return false;
        author.Name = dto.Name;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var author = await _context.Authors.FindAsync(id);
        if (author == null) return false;
        _context.Authors.Remove(author);
        await _context.SaveChangesAsync();
        return true;
    }
}