using UnityEngine;

namespace NACECA.NightRaid.Systems
{
    public class CheckpointManager : MonoBehaviour
    {
        public static CheckpointManager Instance { get; private set; }

        [SerializeField] private Transform player;

        private string lastCheckpointId;
        private Vector3 lastPosition;
        private Quaternion lastRotation;
        private bool hasCheckpoint;

        public string LastCheckpointId => lastCheckpointId;
        public bool HasCheckpoint => hasCheckpoint;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        public void RegisterCheckpoint(string id, Transform spawnPoint)
        {
            if (spawnPoint == null) return;
            lastCheckpointId = id;
            lastPosition = spawnPoint.position;
            lastRotation = spawnPoint.rotation;
            hasCheckpoint = true;
        }

        public void RespawnPlayer()
        {
            if (!hasCheckpoint || player == null) return;

            var controller = player.GetComponent<CharacterController>();
            if (controller != null) controller.enabled = false;
            player.SetPositionAndRotation(lastPosition, lastRotation);
            if (controller != null) controller.enabled = true;
        }
    }
}
