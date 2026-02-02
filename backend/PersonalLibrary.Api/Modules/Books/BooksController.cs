using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Books.Dtos;

namespace PersonalLibrary.Api.Modules.Books;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _db;

    public BooksController(AppDbContext db)
    {
        _db = db;
    }

    // GET: /api/Books
    [HttpGet]
    public async Task<ActionResult<List<Book>>> GetAll()
    {
        var books = await _db.Books.AsNoTracking().ToListAsync();
        return Ok(books);
    }

    // GET: /api/Books/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Book>> GetById(int id)
    {
        var book = await _db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound();
        return Ok(book);
    }

    // POST: /api/Books
    [HttpPost]
    public async Task<ActionResult<Book>> Create([FromBody] CreateBookDto dto)
    {
        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            Description = dto.Description,
            CoverImageUrl = dto.CoverImageUrl,
            Year = dto.Year
        };

        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
    }

    // PUT: /api/Books/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto updated)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound();

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.Description = updated.Description;
        book.CoverImageUrl = updated.CoverImageUrl;
        book.Year = updated.Year;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: /api/Books/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound();

        _db.Books.Remove(book);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
