using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BoardGameHub.Api.Data;

public class AppDbContext : IdentityDbContext<User>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<GameSession> GameSessions { get; set; }
    public DbSet<GameSessionPlayer> GameSessionPlayers { get; set; }
    public DbSet<GameDefinition> Games { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Friendship Configuration
        builder.Entity<Friendship>()
            .HasOne(f => f.Requester)
            .WithMany()
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Friendship>()
            .HasOne(f => f.Addressee)
            .WithMany()
            .HasForeignKey(f => f.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Chat Message Configuration
        builder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Receiver)
            .WithMany()
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Game Session Configuration
        builder.Entity<GameSessionPlayer>()
            .HasOne(p => p.GameSession)
            .WithMany(s => s.Players)
            .HasForeignKey(p => p.GameSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<GameSessionPlayer>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Seed Games
        builder.Entity<GameDefinition>().HasData(
            new GameDefinition 
            { 
                Id = "Scatterbrain", 
                Name = "Scatterbrain", 
                Icon = "🧠", 
                Description = "The classic party game. Come up with unique answers for categories for a chosen letter.", 
                Status = GameStatus.Deployed 
            },
            new GameDefinition 
            { 
                Id = "Boggle", 
                Name = "Boggle", 
                Icon = "🔤", 
                Description = "Find as many words as you can in the grid of letters before time runs out!", 
                Status = GameStatus.Deployed 
            },
            new GameDefinition 
            { 
                Id = "JustOne", 
                Name = "Just One", 
                Icon = "🃏", 
                Description = "Work together to guess the mystery word by writing unique one-word clues.", 
                Status = GameStatus.Deployed 
            },
            new GameDefinition { Id = "Codenames", Name = "Codenames", Icon = "🕵️‍♀️", Description = "Give one-word clues to help your team guess their agents.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Spyfall", Name = "Spyfall", Icon = "🕵️", Description = "Find the spy among you before they figure out the location.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Pictionary", Name = "Pictionary", Icon = "🎨", Description = "Draw and guess words with your friends.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Uno", Name = "Uno", Icon = "🃏", Description = "The classic card game of matching colors and numbers.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Scrabble", Name = "Scrabble", Icon = "📝", Description = "Create words on the board using letter tiles.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Monopoly", Name = "Monopoly", Icon = "🎩", Description = "Buy, sell, and trade properties to win.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Catan", Name = "Settlers of Catan", Icon = "🏰", Description = "Trade, build, and settle the island of Catan.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "TicketToRide", Name = "Ticket to Ride", Icon = "🚂", Description = "Build train routes across the country.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Battleship", Name = "Battleship", Icon = "🚢", Description = "Sink your opponent's fleet before they sink yours.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Connect4", Name = "Connect 4", Icon = "🔴", Description = "Connect four of your checkers in a row.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Checkers", Name = "Checkers", Icon = "🏁", Description = "Jump over opponent pieces to capture them.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Chess", Name = "Chess", Icon = "♟️", Description = "Strategic board game played on a checkered board.", Status = GameStatus.Backlog }
        );
    }
}
