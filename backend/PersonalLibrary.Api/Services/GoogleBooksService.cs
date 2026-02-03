using System.Text.Json;
using PersonalLibrary.Api.Contracts.Books;

namespace PersonalLibrary.Api.Services;

public class GoogleBooksService
{
    private readonly HttpClient _http;
    public GoogleBooksService(HttpClient http) => _http = http;

    public async Task<GoogleBookDto?> GetByIsbnAsync(string isbn)
    {
        var url = $"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}";
        var json = await _http.GetStringAsync(url);

        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("items", out var items) || items.GetArrayLength() == 0)
            return null;

        var v = items[0].GetProperty("volumeInfo");

        string? GetString(string name) => v.TryGetProperty(name, out var p) ? p.GetString() : null;

        var authors = v.TryGetProperty("authors", out var a)
            ? string.Join(", ", a.EnumerateArray().Select(x => x.GetString()))
            : null;

        int? pageCount = v.TryGetProperty("pageCount", out var pc) ? pc.GetInt32() : null;

        string? cover = null;
        if (v.TryGetProperty("imageLinks", out var il) && il.TryGetProperty("thumbnail", out var th))
            cover = th.GetString();

        return new GoogleBookDto
        {
            Title = GetString("title"),
            Authors = authors,
            Description = GetString("description"),
            Publisher = GetString("publisher"),
            PublishedDate = GetString("publishedDate"),
            PageCount = pageCount,
            CoverImageUrl = cover,
            Language = GetString("language")
        };
    }
}
