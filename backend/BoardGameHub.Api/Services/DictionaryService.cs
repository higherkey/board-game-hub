using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Api.Services;

public interface IDictionaryService
{
    bool IsValid(string word);
    string? GetDefinition(string word);
    bool IsDictionaryAvailable { get; }
    int WordCount { get; }
    bool IsInitializationComplete { get; }
}

public class DictionaryService : IDictionaryService
{
    private readonly ILogger<DictionaryService> _logger;
    private bool _isLoaded = false;

    public bool IsDictionaryAvailable => true; // Always available via library
    public int WordCount => 0; // Library doesn't expose total count easily
    public bool IsInitializationComplete => _isLoaded;

    public DictionaryService(ILogger<DictionaryService> logger)
    {
        _logger = logger;
        // Warm up the dictionary in background
        Task.Run(() => {
            try {
                // The library might need a first call to initialize/load data
                global::gnuciDictionary.EnglishDictionary.Define("dictionary");
                _isLoaded = true;
                _logger.LogInformation("gnuciDictionary initialized.");
            } catch (Exception ex) {
                _logger.LogError(ex, "Failed to initialize gnuciDictionary.");
            }
        });
    }

    public bool IsValid(string word)
    {
        if (string.IsNullOrWhiteSpace(word)) return false;
        try 
        {
            var result = global::gnuciDictionary.EnglishDictionary.Define(word.Trim());
            return result != null && result.Any();
        }
        catch 
        {
            return false;
        }
    }

    public string? GetDefinition(string word)
    {
        if (string.IsNullOrWhiteSpace(word)) return null;
        try 
        {
            var result = global::gnuciDictionary.EnglishDictionary.Define(word.Trim());
            if (result == null || !result.Any()) return null;

            // Combine definitions into a single string
            return string.Join("; ", result.Select(r => r.Definition));
        }
        catch 
        {
            return null;
        }
    }
}
