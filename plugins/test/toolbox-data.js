export const toolboxData = [
    [
      {
        icon: "$vcsPen",
        type: "multiSelectButton",
        id: 1,
        open: false,
        options: [
          {
            id: "foo",
            icon: "$vcsPointSelect",
            text: "Item 1",
            selected: true,
          },
          { id: "bar", icon: "$vcsObjectSelect", text: "Item 2" }
        ],
      },
      1,
    ],
    [
      {
        type: "singleSelectButton",
        id: 2,
        open: false,
        options: [
          { id: "delta", icon: "$vcsPointSelect" },
          { id: "zulu", icon: "$vcsObjectSelect" },
        ],
      },
      2,
    ],
    [
      {
        type: "toggleButton",
        id: 3,
        active: true,
      },
      3
    ],
    [
      {
        type: "customComponent",
        component: 'Button',
        id: 5,
        active: true,
      },
      5
    ]
  ]