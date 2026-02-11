using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Books.Dtos;
using PersonalLibrary.Api.Modules.Books.Mappers;
using PersonalLibrary.Api.Services;

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
    public async Task<ActionResult<List<BookDto>>> GetAll()
    {
        var books = await _db.Books.ToListAsync();
        var bookDtos = books.Select(b => b.ToDto()).ToList();
        return Ok(bookDtos);
    }

    // GET: /api/Books/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var book = await _db.Books.FindAsync(id);

        if (book == null)
            return NotFound($"Book with id {id} not found");

        return Ok(book.ToDto());
    }

    // POST: /api/Books
    [HttpPost]
    public async Task<ActionResult<BookDto>> Create([FromBody] CreateBookDto dto)
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

        // Kthen BookDto (jo entity)
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book.ToDto());
    }

    // PUT: /api/Books/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto updated)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound($"Book with id {id} not found");

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
        if (book == null) return NotFound($"Book with id {id} not found");

        _db.Books.Remove(book);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET: /api/Books/external/isbn/xxxxxxxxxx
    [HttpGet("external/isbn/{isbn}")]
    public async Task<IActionResult> GetExternalByIsbn(string isbn, [FromServices] GoogleBooksService svc)
    {
        var result = await svc.GetByIsbnAsync(isbn);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
