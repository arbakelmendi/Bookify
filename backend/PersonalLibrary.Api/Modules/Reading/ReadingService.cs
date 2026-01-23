using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Reading.Dtos;

namespace PersonalLibrary.Api.Modules.Reading;

public class ReadingService
{
    private readonly AppDbContext _context;

    public ReadingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReadingDto>> GetAllAsync(int userId)
    {
        return await _context.UserBooks
            .Where(ub => ub.UserId == userId)
            .Select(ub => new ReadingDto(
                ub.Id,
                ub.UserId,
                ub.BookId,
                ub.Status
            ))
            .ToListAsync();
    }

    public async Task<ReadingDto?> GetByIdAsync(int id, int userId)
    {
        return await _context.UserBooks
            .Where(ub => ub.Id == id && ub.UserId == userId)
            .Select(ub => new ReadingDto(
                ub.Id,
                ub.UserId,
                ub.BookId,
                ub.Status
            ))
            .FirstOrDefaultAsync();
    }

    public async Task<ReadingDto> CreateAsync(int userId, CreateReadingDto dto)
    {
        var userBook = new UserBook
        {
            UserId = userId,
            BookId = dto.BookId,
            Status = dto.Status
        };

        _context.UserBooks.Add(userBook);
        await _context.SaveChangesAsync();

        return new ReadingDto(
            userBook.Id,
            userBook.UserId,
            userBook.BookId,
            userBook.Status
        );
    }

    public async Task<bool> UpdateAsync(int id, int userId, UpdateReadingDto dto)
    {
        var userBook = await _context.UserBooks
            .FirstOrDefaultAsync(ub => ub.Id == id && ub.UserId == userId);

        if (userBook == null) return false;

        userBook.Status = dto.Status;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var userBook = await _context.UserBooks
            .FirstOrDefaultAsync(ub => ub.Id == id && ub.UserId == userId);

        if (userBook == null) return false;

        _context.UserBooks.Remove(userBook);
        await _context.SaveChangesAsync();
        return true;
    }
}