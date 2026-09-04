using System.Collections.Generic;
using System.Linq;

namespace BoardGameHub.Api.Services;

public static class StateRebindExtensions
{
    public static void RebindKey<TValue>(this IDictionary<string, TValue>? dict, string oldId, string newId)
    {
        if (dict != null && dict.Remove(oldId, out var val))
        {
            dict[newId] = val;
        }
    }

    public static void RebindValues<TKey>(this IDictionary<TKey, string>? dict, string oldId, string newId) where TKey : notnull
    {
        if (dict == null) return;
        foreach (var key in dict.Where(kvp => kvp.Value == oldId).Select(kvp => kvp.Key).ToList())
        {
            dict[key] = newId;
        }
    }

    public static void RebindItems(this IList<string>? list, string oldId, string newId)
    {
        if (list == null) return;
        for (int i = 0; i < list.Count; i++)
        {
            if (list[i] == oldId) list[i] = newId;
        }
    }

    public static void RebindSet(this ISet<string>? set, string oldId, string newId)
    {
        if (set != null && set.Remove(oldId))
        {
            set.Add(newId);
        }
    }
}
