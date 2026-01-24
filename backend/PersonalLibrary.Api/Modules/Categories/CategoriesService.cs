using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Categories.Dtos;

namespace PersonalLibrary.Api.Modules.Categories;

public class CategoriesService
{
    private readonly AppDbContext _context;

    public CategoriesService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
        => await _context.Categories
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();

    public async Task<CategoryDto?> GetByIdAsync(int id)
        => await _context.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .FirstOrDefaultAsync();

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var category = new Category { Name = dto.Name };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name);
    }

    public async Task<bool> UpdateAsync(int id, CreateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return false;
        category.Name = dto.Name;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return false;
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }
}