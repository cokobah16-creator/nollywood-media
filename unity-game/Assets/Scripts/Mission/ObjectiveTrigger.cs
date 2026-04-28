using UnityEngine;

namespace NACECA.NightRaid.Mission
{
    [RequireComponent(typeof(Collider))]
    public class ObjectiveTrigger : MonoBehaviour
    {
        [SerializeField] private string objectiveId;
        [SerializeField] private bool requireInteract;
        [SerializeField] private bool oneShot = true;

        private bool fired;

        private void Reset()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (requireInteract) return;
            TryComplete(other);
        }

        public void Interact(GameObject by)
        {
            TryComplete(by != null ? by.GetComponent<Collider>() : null);
        }

        private void TryComplete(Collider other)
        {
            if (oneShot && fired) return;
            if (other == null || !other.CompareTag("Player")) return;

            fired = true;
            MissionManager.Instance?.CompleteObjective(objectiveId);
        }
    }
}
