using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
    private readonly IHttpClientFactory _httpClientFactory;

    public BooksController(AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    // GET: /api/Books?search=&title=&author=&year=&page=1&pageSize=10&sortBy=title&sortDir=asc
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] BookQueryDto q)
    {
        // sanitize paging
        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize < 1 ? 10 : q.PageSize;
        if (pageSize > 50) pageSize = 50; // cap

        var query = _db.Books
            .AsNoTracking()
            .Include(b => b.Category)
            .AsQueryable();

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

        var bookIds = books.Select(b => b.Id).ToList();
        var ratingsByBookId = await _db.BookRatings
            .AsNoTracking()
            .Where(r => bookIds.Contains(r.BookId))
            .GroupBy(r => r.BookId)
            .Select(g => new { BookId = g.Key, Avg = g.Average(x => (double)x.Value) })
            .ToDictionaryAsync(x => x.BookId, x => (double?)Math.Round(x.Avg, 1));

        var items = books
            .Select(b => b.ToDto(ratingsByBookId.GetValueOrDefault(b.Id)))
            .ToList();

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
        var book = await _db.Books
            .AsNoTracking()
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
            return NotFound($"Book with id {id} not found");

        var rating = await _db.BookRatings
            .AsNoTracking()
            .Where(r => r.BookId == id)
            .Select(r => (double?)r.Value)
            .AverageAsync();

        return Ok(book.ToDto(rating is null ? null : Math.Round(rating.Value, 1)));
    }

// POST: /api/Books
[HttpPost]
public async Task<ActionResult<BookDto>> Create([FromBody] CreateBookDto dto)
{
    var categoryId = await ResolveCategoryIdAsync(dto.CategoryId, dto.Category);
    if ((dto.CategoryId.HasValue || !string.IsNullOrWhiteSpace(dto.Category)) && categoryId is null)
        return BadRequest("Invalid category.");

    var book = new Book
    {
        Title = dto.Title,
        Author = dto.Author,
        Description = dto.Description,
        CoverImageUrl = dto.CoverImageUrl,
        Year = dto.Year ?? dto.PublishedYear,
        CategoryId = categoryId,
        PdfUrl = dto.PdfUrl,
        PreviewUrl = dto.PreviewUrl
    };

    _db.Books.Add(book);
    await _db.SaveChangesAsync();

    await UpsertMyRatingIfProvidedAsync(book.Id, dto.Rating);

    await _db.Entry(book).Reference(b => b.Category).LoadAsync();
    var rating = await _db.BookRatings
        .AsNoTracking()
        .Where(r => r.BookId == book.Id)
        .Select(r => (double?)r.Value)
        .AverageAsync();

    return CreatedAtAction(
        nameof(GetById),
        new { id = book.Id },
        book.ToDto(rating is null ? null : Math.Round(rating.Value, 1))
    );
}

// PUT: /api/Books/5
[HttpPut("{id:int}")]
public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto dto)
{
    var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id);
    if (book == null)
        return NotFound($"Book with id {id} not found");

    var categoryId = await ResolveCategoryIdAsync(dto.CategoryId, dto.Category);
    if ((dto.CategoryId.HasValue || !string.IsNullOrWhiteSpace(dto.Category)) && categoryId is null)
        return BadRequest("Invalid category.");

    book.Title = dto.Title;
    book.Author = dto.Author;
    book.Description = dto.Description;
    book.CoverImageUrl = dto.CoverImageUrl;
    book.Year = dto.Year ?? dto.PublishedYear;
    book.CategoryId = categoryId;

    book.PdfUrl = dto.PdfUrl;
    book.PreviewUrl = dto.PreviewUrl;

    await _db.SaveChangesAsync();
    await UpsertMyRatingIfProvidedAsync(book.Id, dto.Rating);
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

    // GET: /api/Books/{id}/pdf-proxy
    [HttpGet("{id:int}/pdf-proxy")]
    public async Task<IActionResult> PdfProxy(int id)
    {
        var book = await _db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (book == null) return NotFound($"Book with id {id} not found");
        if (string.IsNullOrWhiteSpace(book.PdfUrl)) return NotFound("PDF URL is not configured for this book.");

        if (!Uri.TryCreate(book.PdfUrl, UriKind.Absolute, out var pdfUri))
            return BadRequest("Invalid PDF URL.");

        var client = _httpClientFactory.CreateClient();
        var upstream = await client.GetAsync(pdfUri, HttpCompletionOption.ResponseHeadersRead, HttpContext.RequestAborted);
        if (!upstream.IsSuccessStatusCode)
        {
            return StatusCode((int)upstream.StatusCode, "Unable to fetch PDF from upstream source.");
        }

        var contentType = upstream.Content.Headers.ContentType?.MediaType ?? "application/pdf";
        var stream = await upstream.Content.ReadAsStreamAsync(HttpContext.RequestAborted);
        HttpContext.Response.RegisterForDispose(upstream);
        HttpContext.Response.RegisterForDispose(stream);
        return File(stream, contentType);
    }

    private async Task<int?> ResolveCategoryIdAsync(int? categoryId, string? categoryName)
    {
        if (categoryId.HasValue)
        {
            var exists = await _db.Categories.AsNoTracking().AnyAsync(c => c.Id == categoryId.Value);
            return exists ? categoryId : null;
        }

        var name = categoryName?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return null;

        var match = await _db.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());

        return match?.Id;
    }

    private async Task<int?> ResolveActorUserIdAsync()
    {
        var principal = HttpContext?.User;
        if (principal != null)
        {
            var idStr =
                principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
                principal.FindFirstValue("sub");

            if (int.TryParse(idStr, out var id))
            {
                var exists = await _db.Users.AsNoTracking().AnyAsync(u => u.Id == id);
                if (exists) return id;
            }
        }

        var adminId = await _db.Users
            .AsNoTracking()
            .Where(u => u.Role == "admin")
            .OrderBy(u => u.Id)
            .Select(u => (int?)u.Id)
            .FirstOrDefaultAsync();
        if (adminId.HasValue) return adminId;

        return await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => (int?)u.Id)
            .FirstOrDefaultAsync();
    }

    private async Task UpsertMyRatingIfProvidedAsync(int bookId, double? rating)
    {
        if (!rating.HasValue) return;

        var rounded = (int)Math.Round(rating.Value);
        if (rounded < 1 || rounded > 5) return;

        var userId = await ResolveActorUserIdAsync();
        if (!userId.HasValue) return;

        var row = await _db.BookRatings.FirstOrDefaultAsync(x => x.UserId == userId.Value && x.BookId == bookId);
        if (row is null)
        {
            _db.BookRatings.Add(new BookRating
            {
                UserId = userId.Value,
                BookId = bookId,
                Value = rounded,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            row.Value = rounded;
            row.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
