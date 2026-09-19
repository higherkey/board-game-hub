using System.Text.Json;
using System.Text.Json.Nodes;

namespace BoardGameHub.Api.Services;

public class StateDiffService
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(namingPolicy: null) }
    };

    /// <summary>
    /// Compares two objects and returns a JSON patch object representing the difference.
    /// If there are no changes, returns null.
    /// </summary>
    public JsonNode? GetDiff(object oldState, object newState)
    {
        var oldJson = JsonSerializer.SerializeToNode(oldState, _jsonOptions);
        var newJson = JsonSerializer.SerializeToNode(newState, _jsonOptions);

        return GetDiff(oldJson, newJson);
    }

    public JsonNode? GetDiff(JsonNode? oldNode, JsonNode? newNode)
    {
        // 1. If types are different, or one is null, the new one replaces the old one entirely.
        if (oldNode == null && newNode == null) return null;
        if (oldNode == null && newNode != null) return newNode.DeepClone();
        if (oldNode != null && newNode == null) return JsonValue.Create<string?>(null); // Return explicit null node to shadow the old value
                                                             // For a patch, usually "key": null implies nullify, but if we are returning a delta object...
                                                             // Let's return null to signify "set this value to null" in the patch structure.

        // If simple values (not objects/arrays), compare directly
        if (!(oldNode is JsonObject) && !(oldNode is JsonArray))
        {
            return JsonNode.DeepEquals(oldNode, newNode) ? null : newNode!.DeepClone();
        }

        // 2. Handle Objects
        if (oldNode is JsonObject oldObj && newNode is JsonObject newObj)
        {
            var patch = new JsonObject();
            bool hasChanges = false;

            // Check for added or modified properties
            foreach (var property in newObj)
            {
                var key = property.Key;
                var newVal = property.Value;

                if (oldObj.TryGetPropertyValue(key, out var oldVal))
                {
                    if (newVal == null)
                    {
                        if (oldVal != null)
                        {
                            patch[key] = null;
                            hasChanges = true;
                        }
                    }
                    else
                    {
                        // Recursive diff
                        var diff = GetDiff(oldVal, newVal);
                        if (diff != null)
                        {
                            patch[key] = diff;
                            hasChanges = true;
                        }
                    }
                }
                else
                {
                    // New property added
                    // If added as null, we must explicitly send null
                    patch[key] = newVal == null ? null : newVal.DeepClone();
                    hasChanges = true;
                }
            }

            // Check for removed properties (emit explicit null so clients delete/clear them)
            if (oldNode is JsonObject oldObject)
            {
                foreach (var oldProp in oldObject)
                {
                    if (!newObj.ContainsKey(oldProp.Key))
                    {
                        patch[oldProp.Key] = null;
                        hasChanges = true;
                    }
                }
            }
            
            return hasChanges ? patch : null;
        }

        // 3. Handle Arrays
        // Array diffing is complex. For simplicity in this V1, if an array changes at all, we replace the whole array.
        // Deep diffing arrays requires unique IDs or index-based locking which is buggy without strict protocols.
        if (oldNode is JsonArray oldArr && newNode is JsonArray newArr)
        {
            if (JsonNode.DeepEquals(oldArr, newArr)) return null;
            return newArr.DeepClone();
        }

        // Fallback
        return newNode!.DeepClone();
    }
}
