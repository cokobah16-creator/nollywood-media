using System.Collections.Generic;
using NACECA.NightRaid.Core;
using NACECA.NightRaid.Player;
using UnityEngine;
using UnityEngine.AI;

namespace NACECA.NightRaid.Enemy
{
    public enum EnemyState { Patrol, Suspicious, Alerted, Combat, Searching, Dead }

    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(EnemyFieldOfView))]
    public class EnemyAI : MonoBehaviour, IDamageable
    {
        [Header("Patrol")]
        [SerializeField] private List<Transform> patrolPoints = new();
        [SerializeField] private float waitAtPoint = 2f;

        [Header("Awareness")]
        [SerializeField] private float suspicionGainPerSecond = 50f;
        [SerializeField] private float suspicionDecayPerSecond = 8f;
        [SerializeField] private float alertThreshold = 80f;
        [SerializeField] private float searchDuration = 8f;

        [Header("Combat")]
        [SerializeField] private float health = 60f;
        [SerializeField] private float fireRate = 2.5f;
        [SerializeField] private float weaponDamage = 12f;
        [SerializeField] private float engagementRange = 22f;
        [SerializeField] private float aimSpread = 1.5f;
        [SerializeField] private Transform muzzle;

        [Header("Speed")]
        [SerializeField] private float patrolSpeed = 2.2f;
        [SerializeField] private float alertSpeed = 4.5f;

        private NavMeshAgent agent;
        private EnemyFieldOfView fov;
        private EnemyState state = EnemyState.Patrol;
        private int patrolIndex;
        private float waitTimer;
        private float suspicion;
        private float searchTimer;
        private float nextShotTime;
        private Vector3 lastKnownPosition;

        public EnemyState State => state;
        public float SuspicionRatio => Mathf.Clamp01(suspicion / alertThreshold);

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            fov = GetComponent<EnemyFieldOfView>();
        }

        private void OnEnable()
        {
            NoiseEvents.OnNoise += HandleNoise;
        }

        private void OnDisable()
        {
            NoiseEvents.OnNoise -= HandleNoise;
        }

        private void Start()
        {
            agent.speed = patrolSpeed;
            GoToNextPatrolPoint();
        }

        private void Update()
        {
            if (state == EnemyState.Dead) return;

            UpdateAwareness();

            switch (state)
            {
                case EnemyState.Patrol: TickPatrol(); break;
                case EnemyState.Suspicious: TickSuspicious(); break;
                case EnemyState.Alerted: TickAlerted(); break;
                case EnemyState.Combat: TickCombat(); break;
                case EnemyState.Searching: TickSearching(); break;
            }
        }

        private void UpdateAwareness()
        {
            if (fov.HasLineOfSight && fov.CurrentTarget != null)
            {
                suspicion += suspicionGainPerSecond * Time.deltaTime;
                lastKnownPosition = fov.CurrentTarget.position;

                if (suspicion >= alertThreshold)
                {
                    EnterCombat();
                }
                else if (state == EnemyState.Patrol)
                {
                    state = EnemyState.Suspicious;
                }
            }
            else
            {
                suspicion = Mathf.Max(0f, suspicion - suspicionDecayPerSecond * Time.deltaTime);
            }
        }

        private void TickPatrol()
        {
            agent.speed = patrolSpeed;
            if (patrolPoints.Count == 0) return;

            if (!agent.pathPending && agent.remainingDistance < 0.5f)
            {
                waitTimer += Time.deltaTime;
                if (waitTimer >= waitAtPoint)
                {
                    waitTimer = 0f;
                    patrolIndex = (patrolIndex + 1) % patrolPoints.Count;
                    GoToNextPatrolPoint();
                }
            }
        }

        private void TickSuspicious()
        {
            agent.speed = patrolSpeed * 1.3f;
            agent.SetDestination(lastKnownPosition);

            if (suspicion <= 0f)
            {
                state = EnemyState.Patrol;
                GoToNextPatrolPoint();
            }
        }

        private void TickAlerted()
        {
            agent.speed = alertSpeed;
            agent.SetDestination(lastKnownPosition);

            if (fov.HasLineOfSight)
            {
                EnterCombat();
            }
            else if (Vector3.Distance(transform.position, lastKnownPosition) < 1.5f)
            {
                state = EnemyState.Searching;
                searchTimer = searchDuration;
            }
        }

        private void TickCombat()
        {
            agent.speed = alertSpeed;

            if (!fov.HasLineOfSight || fov.CurrentTarget == null)
            {
                state = EnemyState.Alerted;
                return;
            }

            Transform target = fov.CurrentTarget;
            float distance = fov.DistanceToTarget;

            if (distance > engagementRange)
            {
                agent.SetDestination(target.position);
            }
            else
            {
                agent.ResetPath();
                Vector3 lookDir = (target.position - transform.position);
                lookDir.y = 0f;
                if (lookDir.sqrMagnitude > 0.001f)
                {
                    transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(lookDir), Time.deltaTime * 6f);
                }

                if (Time.time >= nextShotTime)
                {
                    Shoot(target);
                    nextShotTime = Time.time + 1f / fireRate;
                }
            }
        }

        private void TickSearching()
        {
            agent.speed = patrolSpeed * 1.2f;
            searchTimer -= Time.deltaTime;

            if (!agent.pathPending && agent.remainingDistance < 0.5f)
            {
                Vector3 random = Random.insideUnitSphere * 6f;
                random.y = 0f;
                if (NavMesh.SamplePosition(lastKnownPosition + random, out var hit, 6f, NavMesh.AllAreas))
                {
                    agent.SetDestination(hit.position);
                }
            }

            if (searchTimer <= 0f)
            {
                state = EnemyState.Patrol;
                GoToNextPatrolPoint();
            }
        }

        private void EnterCombat()
        {
            if (state != EnemyState.Combat)
            {
                AlarmSystem.Instance?.RaiseAlarm(transform.position);
                GameManager.Instance?.RegisterDetection();
            }
            state = EnemyState.Combat;
        }

        private void Shoot(Transform target)
        {
            Vector3 origin = muzzle != null ? muzzle.position : transform.position + Vector3.up * 1.5f;
            Vector3 dir = ((target.position + Vector3.up) - origin).normalized;
            Vector2 spread = Random.insideUnitCircle * (aimSpread * Mathf.Deg2Rad);
            dir += transform.right * spread.x + transform.up * spread.y;

            if (Physics.Raycast(origin, dir.normalized, out RaycastHit hit, engagementRange, ~0, QueryTriggerInteraction.Ignore))
            {
                if (hit.collider.TryGetComponent(out IDamageable damageable))
                {
                    damageable.TakeDamage(weaponDamage, origin);
                }
            }

            NoiseEvents.Emit(transform.position, 25f);
        }

        private void GoToNextPatrolPoint()
        {
            if (patrolPoints.Count == 0) return;
            agent.SetDestination(patrolPoints[patrolIndex].position);
        }

        private void HandleNoise(Vector3 origin, float radius)
        {
            if (state == EnemyState.Dead) return;

            float distance = Vector3.Distance(origin, transform.position);
            if (distance <= radius)
            {
                lastKnownPosition = origin;
                suspicion = Mathf.Max(suspicion, alertThreshold * 0.6f);
                if (state == EnemyState.Patrol) state = EnemyState.Alerted;
            }
        }

        public void TakeDamage(float amount, Vector3 origin)
        {
            if (state == EnemyState.Dead) return;

            health -= amount;
            lastKnownPosition = origin;
            suspicion = alertThreshold;

            if (health <= 0f)
            {
                Die();
            }
            else
            {
                EnterCombat();
            }
        }

        private void Die()
        {
            state = EnemyState.Dead;
            agent.isStopped = true;
            agent.enabled = false;
            enabled = false;
        }
    }
}
