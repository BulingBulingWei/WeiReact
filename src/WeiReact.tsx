interface HTMLElementInformation {
  type: keyof HTMLElementTagNameMap;
  props: {
    [x: string]: any;
    children: ElementInformation[];
  };
}

interface TextElementInformation {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
  };
}

type ElementInformation = HTMLElementInformation | TextElementInformation;

let topNode: ElementInformation = null;
let currentNode: ElementInformation = null;

function createElement(
  type: keyof HTMLElementTagNameMap,
  props: Object,
  ...children: (ElementInformation | string | number)[]
): ElementInformation {
  return {
    type,
    props: {
      ...props,
      children: children
        ? children.map((child) => {
            if (typeof child === "number") {
              return {
                type: "TEXT_ELEMENT",
                props: {
                  nodeValue: child.toString(),
                },
              };
            }
            if (typeof child === "string") {
              return {
                type: "TEXT_ELEMENT",
                props: {
                  nodeValue: child,
                },
              };
            } else {
              return child;
            }
          })
        : [],
    },
  };
}

function render(element: ElementInformation, container: HTMLElement) {
  function createDOM(element: ElementInformation): HTMLElement | Text {
    if (element.type == "TEXT_ELEMENT") {
      return document.createTextNode(element.props.nodeValue);
    } else {
      let dom: HTMLElement = document.createElement(element.type);
      Object.keys(element.props)
        .filter((key) => {
          return key != "chlidren";
        })
        .forEach((key) => {
          //事件
          if (key.startsWith("on")) {
            dom.addEventListener(
              key.substring(2).toLowerCase(),
              element.props[key]
            );
          }
          //其他属性设置
          else {
            dom.setAttribute(key, element.props[key]);
          }
        });
      return dom;
    }
  }

  function DFS(element: ElementInformation): HTMLElement | Text {
    // debugger;
    if (element.type == "TEXT_ELEMENT") {
      return createDOM(element);
    } else {
      debugger;
      let dom = createDOM(element);
      if (element.props.children.length > 0)
        element.props.children.forEach((child) => {
          dom.appendChild(DFS(child));
        });
      return dom;
    }
  }

  container.appendChild(DFS(element));
}

export const WeiReact = {
  createElement,
  render,
};

const element = (
  <div>
    <h1 class="ccc" style="color:red">
      憋叫我猪噢！
    </h1>
    <h1 class="222" style="color:blue">
      好的佩奇~
    </h1>
    <div style="width:200px;height:200px;background-color:#ddedfb;color:black;text-align:center">
      Good night~
    </div>
  </div>
);

render(element, document.getElementById("root"));
