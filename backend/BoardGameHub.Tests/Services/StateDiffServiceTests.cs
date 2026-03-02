using BoardGameHub.Api.Services;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace BoardGameHub.Tests.Services;

public class StateDiffServiceTests
{
    private readonly StateDiffService _service;

    public StateDiffServiceTests()
    {
        _service = new StateDiffService();
    }

    [Fact]
    public void GetDiff_NoChanges_ReturnsNull()
    {
        var original = new { Name = "Test", Value = 1 };
        var modified = new { Name = "Test", Value = 1 };

        var diff = _service.GetDiff(original, modified);

        Assert.Null(diff);
    }

    [Fact]
    public void GetDiff_PrimitiveChange_ReturnsPatch()
    {
        var original = new { Name = "Old", Value = 1 };
        var modified = new { Name = "New", Value = 2 };

        var diff = _service.GetDiff(original, modified);

        Assert.NotNull(diff);
        Assert.Equal("New", diff["Name"]?.GetValue<string>());
        Assert.Equal(2, diff["Value"]?.GetValue<int>());
    }

    [Fact]
    public void GetDiff_NestedObjectChange_ReturnsRecursivePatch()
    {
        var original = new { Config = new { IsEnabled = true, Max = 10 } };
        var modified = new { Config = new { IsEnabled = false, Max = 10 } };

        var diff = _service.GetDiff(original, modified);

        Assert.NotNull(diff);
        Assert.NotNull(diff["Config"]);
        Assert.Equal(false, diff["Config"]?["IsEnabled"]?.GetValue<bool>());
        Assert.Null(diff["Config"]?["Max"]); // Should not be present if unchanged
    }

    [Fact]
    public void GetDiff_ArrayChange_ReturnsFullArrayReplacement()
    {
        var original = new { Items = new[] { 1, 2, 3 } };
        var modified = new { Items = new[] { 1, 2, 4 } };

        var diff = _service.GetDiff(original, modified);

        Assert.NotNull(diff);
        var array = diff["Items"] as JsonArray;
        Assert.NotNull(array);
        Assert.Equal(3, array.Count);
        Assert.Equal(4, array[2]?.GetValue<int>());
    }

    [Fact]
    public void GetDiff_SetToNull_ReturnsNullNode()
    {
        var original = new { Optional = "Value" };
        var modified = new { Optional = (string?)null };

        var diff = _service.GetDiff(original, modified);

        Assert.NotNull(diff);
        // We expect "Optional": null
        // JsonNode allows null values but checking it requires care
        Assert.True(diff.AsObject().ContainsKey("Optional"));
        Assert.Null(diff["Optional"]); 
    }

    [Fact]
    public void GetDiff_NewProperty_ReturnsValue()
    {
        var original = new { Existing = 1 };
        var modified = new { Existing = 1, NewProp = "Added" };

        var diff = _service.GetDiff(original, modified);

        Assert.NotNull(diff);
        Assert.Equal("Added", diff["NewProp"]?.GetValue<string>());
    }
}
