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

    // GET: /api/Books?search=&title=&author=&year=&page=1&pageSize=10&sortBy=title&sortDir=asc
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] BookQueryDto q)
    {
        // sanitize paging
        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize < 1 ? 10 : q.PageSize;
        if (pageSize > 50) pageSize = 50; // cap

        var query = _db.Books.AsNoTracking().AsQueryable();

        // Search (Title OR Author)
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(b =>
                b.Title.Contains(s) ||
                (b.Author != null && b.Author.Contains(s))
            );
        }

        // Filter Title
        if (!string.IsNullOrWhiteSpace(q.Title))
        {
            var t = q.Title.Trim();
            query = query.Where(b => b.Title.Contains(t));
        }

        // Filter Author
        if (!string.IsNullOrWhiteSpace(q.Author))
        {
            var a = q.Author.Trim();
            query = query.Where(b => b.Author != null && b.Author.Contains(a));
        }

        // Filter Year
        if (q.Year.HasValue)
        {
            query = query.Where(b => b.Year == q.Year.Value);
        }

        // Sorting
        var sortBy = (q.SortBy ?? "id").Trim().ToLower();
        var sortDir = (q.SortDir ?? "desc").Trim().ToLower();
        var asc = sortDir == "asc";

        query = sortBy switch
        {
            "title" => asc ? query.OrderBy(b => b.Title) : query.OrderByDescending(b => b.Title),
            "author" => asc ? query.OrderBy(b => b.Author) : query.OrderByDescending(b => b.Author),
            "year" => asc ? query.OrderBy(b => b.Year) : query.OrderByDescending(b => b.Year),
            "id" or _ => asc ? query.OrderBy(b => b.Id) : query.OrderByDescending(b => b.Id)
        };

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var books = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = books.Select(b => b.ToDto()).ToList();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages
        });
    }

    // GET: /api/Books/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var book = await _db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);

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

        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book.ToDto());
    }

    // PUT: /api/Books/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto dto)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book == null)
            return NotFound($"Book with id {id} not found");

        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Description = dto.Description;
        book.CoverImageUrl = dto.CoverImageUrl;
        book.Year = dto.Year;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: /api/Books/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book == null)
            return NotFound($"Book with id {id} not found");

        _db.Books.Remove(book);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET: /api/Books/external/isbn/xxxxxxxxxx
    [HttpGet("external/isbn/{isbn}")]
    public async Task<IActionResult> GetExternalByIsbn(string isbn, [FromServices] GoogleBooksService svc)
    {
        if (string.IsNullOrWhiteSpace(isbn))
            return BadRequest("ISBN is required.");

        var result = await svc.GetByIsbnAsync(isbn.Trim());
        if (result is null) return NotFound();

        return Ok(result);
    }
}
