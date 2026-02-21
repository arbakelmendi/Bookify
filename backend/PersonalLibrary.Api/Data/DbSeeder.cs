using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PersonalLibrary.Api.Models;

namespace PersonalLibrary.Api.Data;

public static class DbSeeder
{
    private sealed record SeedBook(
        string Title,
        string Author,
        string Description,
        int? Year,
        string CoverImageUrl,
        string Category,
        string? PdfUrl = null,
        string? PreviewUrl = null
    );

    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        var categoryMap = await EnsureCategoriesAsync(context);
        var books = GetSeedBooks();

        var existing = await context.Books
            .Include(b => b.Category)
            .ToListAsync();

        var existingByKey = existing
            .GroupBy(b => MakeKey(b.Title, b.Author))
            .ToDictionary(g => g.Key, g => g.ToList());

        var added = 0;
        var updated = 0;

        foreach (var seed in books)
        {
            if (!categoryMap.TryGetValue(seed.Category, out var categoryId))
                continue;

            var key = MakeKey(seed.Title, seed.Author);
            if (!existingByKey.TryGetValue(key, out var matchingBooks) || matchingBooks.Count == 0)
            {
                context.Books.Add(new Book
                {
                    Title = seed.Title,
                    Author = seed.Author,
                    Description = seed.Description,
                    Year = seed.Year,
                    CoverImageUrl = seed.CoverImageUrl,
                    CategoryId = categoryId,
                    PdfUrl = seed.PdfUrl,
                    PreviewUrl = seed.PreviewUrl,
                });
                added++;
                continue;
            }

            foreach (var book in matchingBooks)
            {
                var changed = false;

                if (string.IsNullOrWhiteSpace(book.Description))
                {
                    book.Description = seed.Description;
                    changed = true;
                }

                if (!book.Year.HasValue && seed.Year.HasValue)
                {
                    book.Year = seed.Year;
                    changed = true;
                }

                if (string.IsNullOrWhiteSpace(book.CoverImageUrl) || book.CoverImageUrl.Contains("books.google.com/books/content"))
                {
                    book.CoverImageUrl = seed.CoverImageUrl;
                    changed = true;
                }

                if (book.CategoryId != categoryId)
                {
                    book.CategoryId = categoryId;
                    changed = true;
                }

                if (string.IsNullOrWhiteSpace(book.PdfUrl) && !string.IsNullOrWhiteSpace(seed.PdfUrl))
                {
                    book.PdfUrl = seed.PdfUrl;
                    changed = true;
                }

                if (string.IsNullOrWhiteSpace(book.PreviewUrl) && !string.IsNullOrWhiteSpace(seed.PreviewUrl))
                {
                    book.PreviewUrl = seed.PreviewUrl;
                    changed = true;
                }

                if (changed) updated++;
            }
        }

        if (added > 0 || updated > 0)
        {
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Book seeding completed. Added: {Added}, updated: {Updated}", added, updated);
    }

    private static async Task<Dictionary<string, int>> EnsureCategoriesAsync(AppDbContext context)
    {
        var names = new[]
        {
            "Fiction",
            "Classic",
            "Mystery",
            "Thriller",
            "Horror",
            "Sci-Fi",
            "Fantasy",
            "Romance",
            "Adventure",
            "Self-Help",
            "Psychology",
            "Finance",
            "Biography",
            "History",
            "Philosophy",
            "Business",
            "Programming",
            "Technology",
            "Non-Fiction"
        };

        foreach (var name in names)
        {
            var exists = await context.Categories.AnyAsync(c => c.Name == name);
            if (!exists)
            {
                context.Categories.Add(new Category { Name = name });
            }
        }

        await context.SaveChangesAsync();

        return await context.Categories
            .AsNoTracking()
            .ToDictionaryAsync(c => c.Name, c => c.Id);
    }

    private static List<SeedBook> GetSeedBooks() => new()
    {
        new("And Then There Were None", "Agatha Christie", "Ten strangers on an island are accused and then die one by one.", 1939, "https://covers.openlibrary.org/b/isbn/9780062073488-L.jpg", "Mystery", "https://mysteryshows.com/BBC-And-British-Shows/Agatha-Christie/~%20Ebooks%20-%20Agatha%20Christie/And%20Then%20There%20Were%20None%20-%20Agatha%20Christie.pdf"),
        new("Five Little Pigs", "Agatha Christie", "Poirot investigates a murder from sixteen years ago through five testimonies.", 1942, "https://covers.openlibrary.org/b/isbn/9780062073624-L.jpg", "Mystery", "https://ia800105.us.archive.org/12/items/MegaAgatha/five%20little%20pigs%20-%20agatha%20christie.pdf"),
        new("The 7½ Deaths of Evelyn Hardcastle", "Stuart Turton", "A genre-bending murder mystery trapped inside a time loop.", 2018, "https://covers.openlibrary.org/b/isbn/9781492657965-L.jpg", "Mystery"),
        new("How to Break Up with Your Phone", "Catherine Price", "A 30-day plan to reset your relationship with your phone.", 2018, "https://covers.openlibrary.org/b/isbn/9780399581120-L.jpg", "Self-Help", "/pdfs/13.pdf"),
        new("The Lost Throne", "Chris Kuzneski", "An action-adventure thriller chasing ancient secrets across history.", 2008, "https://covers.openlibrary.org/b/isbn/9780141037073-L.jpg", "Thriller", "/pdfs/14.pdf"),
        new("Clean Code", "Robert C. Martin", "A handbook of agile software craftsmanship and code quality.", 2008, "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg", "Programming"),
        new("Dracula", "Bram Stoker", "A Gothic horror novel about Count Dracula.", 1897, "https://covers.openlibrary.org/b/isbn/9780486411095-L.jpg", "Horror", "https://www.planetebook.com/free-ebooks/dracula.pdf"),
        new("The Adventures of Sherlock Holmes", "Arthur Conan Doyle", "A collection of detective stories featuring Sherlock Holmes.", 1892, "https://covers.openlibrary.org/b/isbn/9780486474915-L.jpg", "Mystery", "https://sherlock-holm.es/stories/pdf/letter/1-sided/advs.pdf"),
        new("How to Take Charge of Your Life: The User’s Guide to NLP", "Richard Bandler", "A practical NLP guide for personal transformation and mindset change.", 2008, "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop", "Self-Help", "/pdfs/15.pdf"),
        new("Refactoring", "Martin Fowler", "Improving the design of existing code.", 1999, "https://covers.openlibrary.org/b/isbn/9780201485677-L.jpg", "Programming", "https://dl.ebooksworld.ir/motoman/Fowler.M-Refactoring-1999.www.EBooksWorld.ir.pdf"),
        new("Domain-Driven Design", "Eric Evans", "Tackling complexity in the heart of software.", 2003, "https://covers.openlibrary.org/b/isbn/9780321125217-L.jpg", "Programming", "https://fabiofumarola.github.io/nosql/readingMaterial/Evans03.pdf"),
        new("Design Patterns", "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", "Elements of reusable object-oriented software.", 1994, "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg", "Programming"),
        new("The Pragmatic Programmer", "Andrew Hunt, David Thomas", "Classic guide to pragmatic thinking and practices.", 1999, "https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg", "Programming"),

        // Free classic novels
        new("Frankenstein", "Mary Shelley", "A foundational gothic novel about science, ambition, and consequence.", 1818, "https://covers.openlibrary.org/b/isbn/9780486282114-L.jpg", "Classic", "https://www.planetebook.com/free-ebooks/frankenstein.pdf"),
        new("Jane Eyre", "Charlotte Bronte", "A coming-of-age classic about identity, love, and independence.", 1847, "https://covers.openlibrary.org/b/isbn/9780141441146-L.jpg", "Classic", "https://www.planetebook.com/free-ebooks/jane-eyre.pdf"),
        new("Moby-Dick", "Herman Melville", "A legendary voyage chasing the white whale.", 1851, "https://covers.openlibrary.org/b/isbn/9780142437247-L.jpg", "Classic", "https://www.planetebook.com/free-ebooks/moby-dick.pdf"),
        new("The Picture of Dorian Gray", "Oscar Wilde", "A dark classic about vanity, morality, and corruption.", 1890, "https://covers.openlibrary.org/b/isbn/9780141439570-L.jpg", "Classic", "https://www.planetebook.com/free-ebooks/the-picture-of-dorian-gray.pdf"),
    };

    private static string MakeKey(string title, string? author)
        => $"{Normalize(title)}::{Normalize(author ?? string.Empty)}";

    private static string Normalize(string value)
        => new(value.Trim().ToLowerInvariant().Where(ch => !char.IsWhiteSpace(ch)).ToArray());
}
