using System;
using NACECA.NightRaid.Core;
using UnityEngine;

namespace NACECA.NightRaid.Player
{
    public class PlayerHealth : MonoBehaviour, IDamageable
    {
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float regenDelay = 4f;
        [SerializeField] private float regenPerSecond = 12f;
        [SerializeField] private float armorAbsorption = 0.4f;

        public event Action<float, float> OnHealthChanged;
        public event Action OnDied;

        private float currentHealth;
        private float currentArmor;
        private float lastDamageTime;
        private bool isDead;

        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public bool IsDead => isDead;

        private void Awake()
        {
            currentHealth = maxHealth;
        }

        private void Update()
        {
            if (isDead) return;

            if (Time.time - lastDamageTime >= regenDelay && currentHealth < maxHealth)
            {
                currentHealth = Mathf.Min(maxHealth, currentHealth + regenPerSecond * Time.deltaTime);
                OnHealthChanged?.Invoke(currentHealth, maxHealth);
            }
        }

        public void TakeDamage(float amount, Vector3 origin)
        {
            if (isDead) return;

            float absorbed = currentArmor > 0f ? amount * armorAbsorption : 0f;
            currentArmor = Mathf.Max(0f, currentArmor - absorbed);
            float effective = amount - absorbed;

            currentHealth = Mathf.Max(0f, currentHealth - effective);
            lastDamageTime = Time.time;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (currentHealth <= 0f)
            {
                Die();
            }
        }

        public void AddArmor(float value)
        {
            currentArmor = Mathf.Min(100f, currentArmor + value);
        }

        public void Heal(float value)
        {
            if (isDead) return;
            currentHealth = Mathf.Min(maxHealth, currentHealth + value);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        private void Die()
        {
            isDead = true;
            OnDied?.Invoke();
            if (GameManager.Instance != null)
            {
                GameManager.Instance.FailMission();
            }
        }
    }

    public interface IDamageable
    {
        void TakeDamage(float amount, Vector3 origin);
    }
}
