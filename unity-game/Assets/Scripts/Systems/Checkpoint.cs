using UnityEngine;

namespace NACECA.NightRaid.Systems
{
    [RequireComponent(typeof(Collider))]
    public class Checkpoint : MonoBehaviour
    {
        [SerializeField] private string checkpointId;

        private bool used;

        private void Reset()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (used || !other.CompareTag("Player")) return;

            used = true;
            CheckpointManager.Instance?.RegisterCheckpoint(checkpointId, transform);
        }
    }
}
