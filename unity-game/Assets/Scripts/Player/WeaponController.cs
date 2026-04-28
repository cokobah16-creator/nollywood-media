using System;
using System.Collections;
using NACECA.NightRaid.Core;
using UnityEngine;

namespace NACECA.NightRaid.Player
{
    [Serializable]
    public class WeaponData
    {
        public string displayName = "Silenced Pistol";
        public float damage = 35f;
        public float fireRate = 4f;
        public float range = 80f;
        public int magazineSize = 12;
        public int reserveAmmo = 60;
        public float reloadSeconds = 1.6f;
        public float spreadAimed = 0.5f;
        public float spreadHip = 3.5f;
        public float noiseRadius = 6f;
        public bool suppressed = true;
        public AudioClip fireClip;
        public AudioClip reloadClip;
    }

    public class WeaponController : MonoBehaviour
    {
        [SerializeField] private WeaponData weapon = new WeaponData();
        [SerializeField] private Transform muzzle;
        [SerializeField] private Camera fpCamera;
        [SerializeField] private LayerMask hitMask = ~0;
        [SerializeField] private GameObject impactPrefab;
        [SerializeField] private AudioSource audioSource;

        public event Action<int, int> OnAmmoChanged;
        public event Action OnFired;

        private int magazine;
        private int reserve;
        private float nextFireAllowedAt;
        private bool reloading;

        public WeaponData Weapon => weapon;
        public int Magazine => magazine;
        public int Reserve => reserve;
        public bool IsReloading => reloading;

        private void Awake()
        {
            magazine = weapon.magazineSize;
            reserve = weapon.reserveAmmo;
            OnAmmoChanged?.Invoke(magazine, reserve);
        }

        private void Update()
        {
            if (InputReader.Instance == null) return;

            if (InputReader.Instance.FirePressed)
            {
                TryFire();
            }

            if (InputReader.Instance.ReloadPressed && !reloading)
            {
                StartCoroutine(Reload());
            }
        }

        private void TryFire()
        {
            if (reloading) return;
            if (Time.time < nextFireAllowedAt) return;

            if (magazine <= 0)
            {
                StartCoroutine(Reload());
                return;
            }

            nextFireAllowedAt = Time.time + 1f / Mathf.Max(0.1f, weapon.fireRate);
            magazine--;
            OnAmmoChanged?.Invoke(magazine, reserve);
            OnFired?.Invoke();

            if (audioSource != null && weapon.fireClip != null)
            {
                audioSource.PlayOneShot(weapon.fireClip);
            }

            float spread = InputReader.Instance.AimHeld ? weapon.spreadAimed : weapon.spreadHip;
            Vector3 direction = GetSpreadDirection(spread);
            Vector3 origin = fpCamera != null ? fpCamera.transform.position : muzzle.position;

            if (Physics.Raycast(origin, direction, out RaycastHit hit, weapon.range, hitMask, QueryTriggerInteraction.Ignore))
            {
                if (hit.collider.TryGetComponent(out IDamageable damageable))
                {
                    damageable.TakeDamage(weapon.damage, origin);
                }

                if (impactPrefab != null)
                {
                    Instantiate(impactPrefab, hit.point, Quaternion.LookRotation(hit.normal));
                }
            }

            NoiseEvents.Emit(transform.position, weapon.suppressed ? weapon.noiseRadius : weapon.noiseRadius * 4f);
        }

        private Vector3 GetSpreadDirection(float spread)
        {
            Transform t = fpCamera != null ? fpCamera.transform : transform;
            Vector3 dir = t.forward;
            float spreadRad = spread * Mathf.Deg2Rad;
            Vector2 random = UnityEngine.Random.insideUnitCircle * spreadRad;
            dir += t.right * random.x + t.up * random.y;
            return dir.normalized;
        }

        private IEnumerator Reload()
        {
            if (reserve <= 0 || magazine == weapon.magazineSize) yield break;

            reloading = true;
            if (audioSource != null && weapon.reloadClip != null)
            {
                audioSource.PlayOneShot(weapon.reloadClip);
            }

            yield return new WaitForSeconds(weapon.reloadSeconds);

            int needed = weapon.magazineSize - magazine;
            int taken = Mathf.Min(needed, reserve);
            magazine += taken;
            reserve -= taken;
            reloading = false;
            OnAmmoChanged?.Invoke(magazine, reserve);
        }
    }
}
