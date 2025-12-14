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
                Id = "Babble", 
                Name = "Babble", 
                Icon = "🔤", 
                Description = "Find as many words as you can in the grid of letters before time runs out!", 
                Status = GameStatus.Deployed 
            },
            new GameDefinition 
            { 
                Id = "OneAndOnly", 
                Name = "One & Only", 
                Icon = "🃏", 
                Description = "Work together to guess the mystery word by writing unique one-word clues.", 
                Status = GameStatus.Deployed 
            },
            new GameDefinition { Id = "NomDeCode", Name = "Nom de Code", Icon = "🕵️‍♀️", Description = "Give one-word clues to help your team guess their agents.", Status = GameStatus.Backlog },

            new GameDefinition { Id = "Warships", Name = "Warships", Icon = "🚢", Description = "Sink your opponent's fleet before they sink yours.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "FourInARow", Name = "Four in a Row", Icon = "🔴", Description = "Connect four of your checkers in a row.", Status = GameStatus.Backlog },
            new GameDefinition { Id = "Checkers", Name = "Checkers", Icon = "🏁", Description = "Jump over opponent pieces to capture them.", Status = GameStatus.Backlog },

            
            // New User Picks
            new GameDefinition { Id = "UniversalTranslator", Name = "Universal Translator", Icon = "👽", Description = "Communication game with a hidden traitor.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "Pictophone", Name = "Pictophone", Icon = "🎨", Description = "Telephone with drawings.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "Wisecrack", Name = "Wisecrack", Icon = "💬", Description = "Answer simple prompts with witty answers.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "Poppycock", Name = "Poppycock", Icon = "🤥", Description = "Bluff your friends with fake definitions.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "Symbology", Name = "Symbology", Icon = "💡", Description = "Communicate ideas using universal icons.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "BreakingNews", Name = "Breaking News", Icon = "📰", Description = "Frantic teleprompter fun where writers sabotage the anchor.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "Deepfake", Name = "Deepfake", Icon = "🤖", Description = "A generative AI tries to blend in with human artists.", Status = GameStatus.Deployed },
            new GameDefinition { Id = "SushiTrain", Name = "Sushi Train!", Icon = "🍣", Description = "Draft the best meal from the passing conveyor belt!", Status = GameStatus.Deployed },
            new GameDefinition { Id = "GreatMinds", Name = "Great Minds", Icon = "🧠", Description = "Synchronize your minds and play cards in ascending order without speaking!", Status = GameStatus.Deployed }
        );
    }
}
