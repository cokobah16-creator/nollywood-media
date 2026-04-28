using NACECA.NightRaid.Core;
using NACECA.NightRaid.Enemy;
using NACECA.NightRaid.Player;
using UnityEngine;

namespace NACECA.NightRaid.Systems
{
    public class TakedownSystem : MonoBehaviour
    {
        [SerializeField] private Transform player;
        [SerializeField] private Camera fpCamera;
        [SerializeField] private float reach = 2f;
        [SerializeField] private float backstabAngle = 60f;
        [SerializeField] private float noiseRadius = 1.5f;
        [SerializeField] private LayerMask enemyMask;
        [SerializeField] private AudioClip takedownClip;

        private void Update()
        {
            if (InputReader.Instance == null || !InputReader.Instance.InteractPressed) return;
            if (fpCamera == null) return;

            if (Physics.Raycast(fpCamera.transform.position, fpCamera.transform.forward, out RaycastHit hit, reach, enemyMask, QueryTriggerInteraction.Ignore))
            {
                if (!hit.collider.TryGetComponent(out EnemyAI enemy)) return;
                if (enemy.State == EnemyState.Combat) return;

                Vector3 toPlayer = (player.position - enemy.transform.position).normalized;
                float angle = Vector3.Angle(enemy.transform.forward, toPlayer);

                if (angle < 180f - backstabAngle) return;

                enemy.TakeDamage(9999f, player.position);
                NoiseEvents.Emit(player.position, noiseRadius);

                if (Audio.AudioManager.Instance != null && takedownClip != null)
                {
                    Audio.AudioManager.Instance.PlaySfx(takedownClip, player.position);
                }
            }
        }
    }
}
