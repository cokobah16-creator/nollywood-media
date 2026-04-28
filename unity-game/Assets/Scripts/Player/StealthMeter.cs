using System;
using UnityEngine;

namespace NACECA.NightRaid.Player
{
    public class StealthMeter : MonoBehaviour
    {
        [SerializeField] private float maxStealth = 100f;
        [SerializeField] private float regenPerSecond = 6f;
        [SerializeField] private float exposureRegenDelay = 2f;

        public event Action<float, float> OnStealthChanged;

        private float current;
        private float lastExposureTime;

        public float Current => current;
        public float Max => maxStealth;

        private void Awake()
        {
            current = maxStealth;
        }

        private void Update()
        {
            if (Time.time - lastExposureTime > exposureRegenDelay && current < maxStealth)
            {
                current = Mathf.Min(maxStealth, current + regenPerSecond * Time.deltaTime);
                OnStealthChanged?.Invoke(current, maxStealth);
            }
        }

        public void Expose(float intensity)
        {
            current = Mathf.Max(0f, current - intensity);
            lastExposureTime = Time.time;
            OnStealthChanged?.Invoke(current, maxStealth);
        }

        public bool IsBlown => current <= 0f;
    }
}
