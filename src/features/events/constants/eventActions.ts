export type EventAction = "publish" | "cancel" | "delete";
export const EVENT_ACTION_CONFIG = {
    publish: {
        title: "Publish Event?",
        message:
            "The event will become visible to participants and registrations will start automatically when the configured registration time is reached.",
        confirmText: "Publish",
        variant: "primary",
    },

    cancel: {
        title: "Cancel Event?",
        message:
            "The event will be cancelled and cannot continue. Participants will no longer be able to join or submit.",
        confirmText: "Cancel Event",
        variant: "danger",
    },

    delete: {
        title: "Delete Event?",
        message:
            "This will permanently delete the event and all associated data including categories, rounds and scores.",
        confirmText: "Delete",
        variant: "danger",
    },
} as const;