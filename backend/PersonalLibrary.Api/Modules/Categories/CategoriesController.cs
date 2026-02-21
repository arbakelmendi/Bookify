using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Categories.Dtos;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var items = await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name required.");

        var exists = await _db.Categories.AnyAsync(c => c.Name == name);
        if (exists) return Conflict("Category already exists.");

        var cat = new Category { Name = name };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new CategoryDto(cat.Id, cat.Name));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, UpdateCategoryDto dto)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat is null) return NotFound();

        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name required.");

        var exists = await _db.Categories.AnyAsync(c => c.Name == name && c.Id != id);
        if (exists) return Conflict("Category name already used.");

        cat.Name = name;
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto(cat.Id, cat.Name));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat is null) return NotFound();

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
