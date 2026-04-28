using UnityEngine;

namespace NACECA.NightRaid.Enemy
{
    public class EnemyFieldOfView : MonoBehaviour
    {
        [Header("Vision Cone")]
        [SerializeField] private float viewDistance = 18f;
        [SerializeField, Range(0f, 180f)] private float viewAngle = 65f;
        [SerializeField] private LayerMask targetMask;
        [SerializeField] private LayerMask obstacleMask;

        [Header("Awareness")]
        [SerializeField] private float peripheralAngle = 130f;
        [SerializeField] private float peripheralDistance = 6f;

        [Header("Eye")]
        [SerializeField] private Transform eye;

        public Transform CurrentTarget { get; private set; }
        public bool HasLineOfSight { get; private set; }
        public float DistanceToTarget { get; private set; }

        private void FixedUpdate()
        {
            ScanForTargets();
        }

        private void ScanForTargets()
        {
            CurrentTarget = null;
            HasLineOfSight = false;

            Vector3 origin = eye != null ? eye.position : transform.position + Vector3.up * 1.6f;

            Collider[] hits = Physics.OverlapSphere(origin, viewDistance, targetMask);
            foreach (var hit in hits)
            {
                Vector3 toTarget = (hit.transform.position + Vector3.up) - origin;
                float distance = toTarget.magnitude;
                Vector3 dir = toTarget / Mathf.Max(0.001f, distance);

                float angle = Vector3.Angle(transform.forward, dir);
                bool inCone = angle <= viewAngle * 0.5f && distance <= viewDistance;
                bool inPeripheral = angle <= peripheralAngle * 0.5f && distance <= peripheralDistance;

                if (!inCone && !inPeripheral) continue;

                if (Physics.Raycast(origin, dir, distance, obstacleMask, QueryTriggerInteraction.Ignore))
                {
                    continue;
                }

                CurrentTarget = hit.transform;
                HasLineOfSight = true;
                DistanceToTarget = distance;
                return;
            }
        }

        private void OnDrawGizmosSelected()
        {
            Vector3 origin = eye != null ? eye.position : transform.position + Vector3.up * 1.6f;
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(origin, viewDistance);

            Vector3 left = Quaternion.AngleAxis(-viewAngle * 0.5f, Vector3.up) * transform.forward;
            Vector3 right = Quaternion.AngleAxis(viewAngle * 0.5f, Vector3.up) * transform.forward;
            Gizmos.color = Color.red;
            Gizmos.DrawRay(origin, left * viewDistance);
            Gizmos.DrawRay(origin, right * viewDistance);
        }
    }
}
