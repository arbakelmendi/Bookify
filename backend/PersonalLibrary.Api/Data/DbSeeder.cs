using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PersonalLibrary.Api.Models;

namespace PersonalLibrary.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Books.AnyAsync())
        {
            logger.LogInformation("Book seeding skipped: books already exist.");
            return;
        }

        var books = new List<Book>
        {
            new() { Title = "The Midnight Library", Author = "Matt Haig", Year = 2020, Description = "Nora explores alternate lives in a library between life and death, discovering what makes a life worth living.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10504762-L.jpg" },
            new() { Title = "Project Hail Mary", Author = "Andy Weir", Year = 2021, Description = "A lone astronaut must save Earth from a cosmic catastrophe using science, wit, and an unexpected friendship.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10592589-L.jpg" },
            new() { Title = "Atomic Habits", Author = "James Clear", Year = 2018, Description = "A practical guide to building good habits and breaking bad ones through small, consistent changes.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10218674-L.jpg" },
            new() { Title = "The Psychology of Money", Author = "Morgan Housel", Year = 2020, Description = "Timeless lessons on wealth, greed, and happiness explained through short stories and behavioral insights.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10508168-L.jpg" },
            new() { Title = "Dune", Author = "Frank Herbert", Year = 1965, Description = "Epic science fiction on the desert planet Arrakis, where politics, prophecy, and power collide.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8101350-L.jpg" },
            new() { Title = "The Silent Patient", Author = "Alex Michaelides", Year = 2019, Description = "A psychotherapist unravels the mystery of a woman who stopped speaking after a shocking crime.", CoverImageUrl = "https://covers.openlibrary.org/b/id/9259251-L.jpg" },
            new() { Title = "Tomorrow, and Tomorrow, and Tomorrow", Author = "Gabrielle Zevin", Year = 2022, Description = "A decades-long friendship and creative partnership unfolds through the world of video games.", CoverImageUrl = "https://covers.openlibrary.org/b/id/12810884-L.jpg" },
            new() { Title = "The Name of the Wind", Author = "Patrick Rothfuss", Year = 2007, Description = "Kvothe tells the story of his legendary life, full of magic, music, and mystery.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8231996-L.jpg" },
            new() { Title = "The Martian", Author = "Andy Weir", Year = 2014, Description = "An astronaut stranded on Mars must improvise to survive against impossible odds.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8370226-L.jpg" },
            new() { Title = "The Alchemist", Author = "Paulo Coelho", Year = 1988, Description = "A shepherd follows his dreams to find treasure and discovers his personal legend.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10564266-L.jpg" },
            new() { Title = "Educated", Author = "Tara Westover", Year = 2018, Description = "A memoir about growing up in a survivalist family and seeking education against the odds.", CoverImageUrl = "https://covers.openlibrary.org/b/id/9251985-L.jpg" },
            new() { Title = "Sapiens", Author = "Yuval Noah Harari", Year = 2011, Description = "A sweeping history of humankind and the forces that shaped our world.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10340513-L.jpg" },
            new() { Title = "The Hobbit", Author = "J.R.R. Tolkien", Year = 1937, Description = "Bilbo Baggins is swept into a quest to reclaim a lost dwarf kingdom.", CoverImageUrl = "https://covers.openlibrary.org/b/id/6979861-L.jpg" },
            new() { Title = "The Catcher in the Rye", Author = "J.D. Salinger", Year = 1951, Description = "Holden Caulfield narrates a few turbulent days in New York City.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8235116-L.jpg" },
            new() { Title = "The Great Gatsby", Author = "F. Scott Fitzgerald", Year = 1925, Description = "A tragic story of love and obsession in the Jazz Age.", CoverImageUrl = "https://covers.openlibrary.org/b/id/7222246-L.jpg" },
            new() { Title = "To Kill a Mockingbird", Author = "Harper Lee", Year = 1960, Description = "A story of justice, empathy, and childhood in the American South.", CoverImageUrl = "https://covers.openlibrary.org/b/id/9877870-L.jpg" },
            new() { Title = "1984", Author = "George Orwell", Year = 1949, Description = "A chilling dystopia of surveillance, propaganda, and total control.", CoverImageUrl = "https://covers.openlibrary.org/b/id/7222241-L.jpg" },
            new() { Title = "Pride and Prejudice", Author = "Jane Austen", Year = 1813, Description = "A witty romance about first impressions and social class.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8091016-L.jpg" },
            new() { Title = "The Road", Author = "Cormac McCarthy", Year = 2006, Description = "A father and son journey through a bleak post‑apocalyptic world.", CoverImageUrl = "https://covers.openlibrary.org/b/id/7222161-L.jpg" },
            new() { Title = "The Four Winds", Author = "Kristin Hannah", Year = 2021, Description = "A family fights for survival during the Great Depression and Dust Bowl.", CoverImageUrl = "https://covers.openlibrary.org/b/id/10300298-L.jpg" },
            new() { Title = "Circe", Author = "Madeline Miller", Year = 2018, Description = "The witch Circe’s story reimagined with power, exile, and transformation.", CoverImageUrl = "https://covers.openlibrary.org/b/id/9259253-L.jpg" },
            new() { Title = "The Song of Achilles", Author = "Madeline Miller", Year = 2011, Description = "A retelling of the Iliad through the bond between Achilles and Patroclus.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8235073-L.jpg" },
            new() { Title = "The Subtle Art of Not Giving a F*ck", Author = "Mark Manson", Year = 2016, Description = "A counterintuitive approach to living a good life by embracing limitations.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8370231-L.jpg" },
            new() { Title = "The Kite Runner", Author = "Khaled Hosseini", Year = 2003, Description = "A powerful story of friendship, betrayal, and redemption in Afghanistan.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8231856-L.jpg" },
            new() { Title = "The Night Circus", Author = "Erin Morgenstern", Year = 2011, Description = "A magical competition unfolds within a mysterious circus that appears at night.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8235122-L.jpg" },
            new() { Title = "The Girl on the Train", Author = "Paula Hawkins", Year = 2015, Description = "A psychological thriller about memory, obsession, and a missing woman.", CoverImageUrl = "https://covers.openlibrary.org/b/id/8225632-L.jpg" }
        };

        try
        {
            await context.Books.AddRangeAsync(books);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} books.", books.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed books.");
        }
    }
}
