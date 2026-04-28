using System;
using UnityEngine;

namespace NACECA.NightRaid.Core
{
    public static class NoiseEvents
    {
        public static event Action<Vector3, float> OnNoise;

        public static void Emit(Vector3 origin, float radius)
        {
            OnNoise?.Invoke(origin, radius);
        }
    }
}
