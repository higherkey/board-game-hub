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
                Status = GameStatus.InDevelopment,
                MinPlayers = 2, MaxPlayers = 10, Complexity = 1, AveragePlayTime = 15, Tags = "Word,Party,Timed",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 180,
                SettingsMetadataJson = "[{\"id\":\"letterMode\",\"label\":\"Letter Difficulty\",\"type\":\"select\",\"options\":[{\"label\":\"Normal (No Q, V,X, Z)\",\"value\":0},{\"label\":\"Hard (Only Q, V, X, Z...)\",\"value\":1},{\"label\":\"True Random\",\"value\":2}]}]"
            },
            new GameDefinition 
            { 
                Id = "Babble", 
                Name = "Babble", 
                Icon = "🔤", 
                Description = "Find as many words as you can in the grid of letters before time runs out!", 
                Status = GameStatus.Testing,
                MinPlayers = 1, MaxPlayers = 8, Complexity = 2, AveragePlayTime = 10, Tags = "Word,Puzzle,Timed",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 180,
                SettingsMetadataJson = "[{\"id\":\"boardSize\",\"label\":\"Board Size\",\"type\":\"select\",\"options\":[{\"label\":\"4x4 (Classic)\",\"value\":4},{\"label\":\"5x5 (Big Babble)\",\"value\":5},{\"label\":\"6x6 (Super Babble)\",\"value\":6}]}]"
            },
            new GameDefinition 
            { 
                Id = "OneAndOnly", 
                Name = "One & Only", 
                Icon = "🃏", 
                Description = "Work together to guess the mystery word by writing unique one-word clues.", 
                Status = GameStatus.InDevelopment,
                MinPlayers = 3, MaxPlayers = 7, Complexity = 1, AveragePlayTime = 20, Tags = "Cooperative,Word,Social",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "NomDeCode", Name = "Nom de Code", Icon = "🕵️‍♀️", Description = "Give one-word clues to help your team guess their agents.", Status = GameStatus.InDevelopment,
                MinPlayers = 4, MaxPlayers = 8, Complexity = 2, AveragePlayTime = 25, Tags = "Teams,Word,Social",
                TimerType = TimerType.Optional, DefaultRoundLengthSeconds = 0
            },

            new GameDefinition { 
                Id = "Warships", Name = "Warships", Icon = "🚢", Description = "Sink your opponent's fleet before they sink yours.", Status = GameStatus.InDevelopment,
                MinPlayers = 2, MaxPlayers = 2, Complexity = 2, AveragePlayTime = 15, Tags = "Strategy,Combat",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "FourInARow", Name = "Four in a Row", Icon = "🔴", Description = "Connect four of your checkers in a row.", Status = GameStatus.InDevelopment,
                MinPlayers = 2, MaxPlayers = 2, Complexity = 1, AveragePlayTime = 5, Tags = "Strategy,Puzzle",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },

            
            // New User Picks
            new GameDefinition { 
                Id = "UniversalTranslator", Name = "Universal Translator", Icon = "👽", Description = "Communication game with a hidden traitor.", Status = GameStatus.InDevelopment,
                MinPlayers = 4, MaxPlayers = 8, Complexity = 3, AveragePlayTime = 45, Tags = "Social Deduction,Sci-Fi,Bluffing",
                TimerType = TimerType.Optional, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "Pictophone", Name = "Pictophone", Icon = "🎨", Description = "Telephone with drawings.", Status = GameStatus.InDevelopment,
                MinPlayers = 4, MaxPlayers = 12, Complexity = 1, AveragePlayTime = 30, Tags = "Drawing,Party,Humor",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 60
            },
            new GameDefinition { 
                Id = "Wisecrack", Name = "Wisecrack", Icon = "💬", Description = "Answer simple prompts with witty answers.", Status = GameStatus.InDevelopment,
                MinPlayers = 3, MaxPlayers = 8, Complexity = 1, AveragePlayTime = 20, Tags = "Humor,Social,Party",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 90
            },
            new GameDefinition { 
                Id = "Poppycock", Name = "Poppycock", Icon = "🤥", Description = "Bluff your friends with fake definitions.", Status = GameStatus.InDevelopment,
                MinPlayers = 3, MaxPlayers = 8, Complexity = 2, AveragePlayTime = 30, Tags = "Bluffing,Word,Social",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0 // Optional but defaults to no timer
            },
            new GameDefinition { 
                Id = "Symbology", Name = "Symbology", Icon = "💡", Description = "Communicate ideas using universal icons.", Status = GameStatus.InDevelopment,
                MinPlayers = 3, MaxPlayers = 8, Complexity = 2, AveragePlayTime = 20, Tags = "Cooperative,Communication,Icons",
                TimerType = TimerType.Optional, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "BreakingNews", Name = "Breaking News", Icon = "📰", Description = "Frantic teleprompter fun where writers sabotage the anchor.", Status = GameStatus.InDevelopment,
                MinPlayers = 3, MaxPlayers = 10, Complexity = 1, AveragePlayTime = 15, Tags = "Humor,Social,Party,Timed",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 60
            },
            new GameDefinition { 
                Id = "Deepfake", Name = "Deepfake", Icon = "🤖", Description = "A generative AI tries to blend in with human artists.", Status = GameStatus.InDevelopment,
                MinPlayers = 4, MaxPlayers = 10, Complexity = 2, AveragePlayTime = 20, Tags = "Social Deduction,Drawing,AI",
                TimerType = TimerType.Optional, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "SushiTrain", Name = "Sushi Train!", Icon = "🍣", Description = "Draft the best meal from the passing conveyor belt!", Status = GameStatus.InDevelopment,
                MinPlayers = 2, MaxPlayers = 5, Complexity = 2, AveragePlayTime = 25, Tags = "Drafting,Card Game,Family",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "GreatMinds", Name = "Great Minds", Icon = "🌟", Description = "Synchronize your minds and play cards in ascending order without speaking!", Status = GameStatus.InDevelopment,
                MinPlayers = 2, MaxPlayers = 4, Complexity = 2, AveragePlayTime = 20, Tags = "Cooperative,Card Game,Social",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },

            // Backlog (Conceptual Games)
            new GameDefinition { 
                Id = "Farkle", Name = "Farkle", Icon = "🎲", Description = "Push your luck with six dice to score 10,000 points!", Status = GameStatus.Backlog,
                MinPlayers = 1, MaxPlayers = 8, Complexity = 1, AveragePlayTime = 20, Tags = "Dice,Party,Luck",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "Spectrum", Name = "Spectrum", Icon = "🌈", Description = "Read your team's mind on a scale of polar opposites.", Status = GameStatus.Backlog,
                MinPlayers = 2, MaxPlayers = 12, Complexity = 2, AveragePlayTime = 30, Tags = "Social,Party,Team",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "Courtship", Name = "Courtship", Icon = "💌", Description = "Get your love letter delivered while exposing your rivals.", Status = GameStatus.Backlog,
                MinPlayers = 2, MaxPlayers = 4, Complexity = 2, AveragePlayTime = 20, Tags = "Deduction,Cards,Risk",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "SilentHeist", Name = "Silent Heist", Icon = "🤫", Description = "Coordinate moves in silence to rob a secure facility.", Status = GameStatus.Backlog,
                MinPlayers = 1, MaxPlayers = 8, Complexity = 3, AveragePlayTime = 10, Tags = "Coop,Real-time,Puzzle",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 180
            },
            new GameDefinition { 
                Id = "FoleyArtist", Name = "Foley Artist", Icon = "🎤", Description = "Make sound effects for silent clips and have your friends guess the scene.", Status = GameStatus.Backlog,
                MinPlayers = 3, MaxPlayers = 8, Complexity = 1, AveragePlayTime = 20, Tags = "Audio,Party,Creative",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 60
            },
            new GameDefinition { 
                Id = "LostInTranslation", Name = "Lost in Translation", Icon = "🗣️", Description = "Identify famous phrases garbled by too many translations.", Status = GameStatus.Backlog,
                MinPlayers = 3, MaxPlayers = 12, Complexity = 1, AveragePlayTime = 15, Tags = "Word,Humor,Puzzle",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 60
            },
            new GameDefinition { 
                Id = "CodeBreaker", Name = "Code Breaker", Icon = "🔐", Description = "Hack the system by deducing the secret color sequence.", Status = GameStatus.Backlog,
                MinPlayers = 2, MaxPlayers = 6, Complexity = 2, AveragePlayTime = 15, Tags = "Logic,Deduction,Puzzle",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "Yacht", Name = "Yacht", Icon = "⛵", Description = "Classic dice rolling strategy. Get five of a kind!", Status = GameStatus.Backlog,
                MinPlayers = 1, MaxPlayers = 8, Complexity = 1, AveragePlayTime = 30, Tags = "Dice,Strategy,Classic",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            },
            new GameDefinition { 
                Id = "Terminal", Name = "Terminal", Icon = "📟", Description = "One Hacker. Four Agents. Keep talking to survive the infiltration.", Status = GameStatus.Backlog,
                MinPlayers = 2, MaxPlayers = 5, Complexity = 3, AveragePlayTime = 20, Tags = "Cooperative,Asymmetric,Real-Time",
                TimerType = TimerType.Required, DefaultRoundLengthSeconds = 300
            },
            new GameDefinition { 
                Id = "CloverMinded", Name = "Clover-Minded", Icon = "🍀", Description = "Work together to associate keywords on your clover board.", Status = GameStatus.Backlog,
                MinPlayers = 3, MaxPlayers = 6, Complexity = 2, AveragePlayTime = 25, Tags = "Cooperative,Word,Party",
                TimerType = TimerType.NotApplicable, DefaultRoundLengthSeconds = 0
            }
        );
    }
}
