// 标签元素
interface HTMLElementInformation {
  type: keyof HTMLElementTagNameMap;
  props: {
    [x: string]: any;
    children: ElementInformation[];
  };
}

function isHTMLElementInformation(x: any): x is HTMLElementInformation {
  return (x as HTMLElementInformation).props.children != undefined;
}

// 字符串元素（叶子元素）
interface TextElementInformation {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
  };
}

function isTextElementInformation(x: any): x is TextElementInformation {
  return (x as TextElementInformation).type == "TEXT_ELEMENT";
}

// 函数式组件
interface FunctionElementInformation {
  //函数式组件，类型是一个返回 ElementInformation 的函数
  type: (props: any) => ElementInformation;
  props: {};
  hooks: { state: any; actions: ((state: any) => any)[] }[];
}

function isFunctionElementInformation(x: any): x is FunctionElementInformation {
  return typeof (x as FunctionElementInformation).type == "function";
}

type ElementInformation =
  | HTMLElementInformation
  | TextElementInformation
  | FunctionElementInformation;

interface FiberInformation {
  dom: HTMLElement | Text;
  parent: Fiber;
  child: Fiber;
  sibling: Fiber;
}

type Fiber = ElementInformation & FiberInformation;

let topNode: Fiber = null;
let currentNode: Fiber = null;
let hookIndex = -1;

//----------------------------------------------------------------

function createElement(
  type: keyof HTMLElementTagNameMap | ((props: any) => ElementInformation),
  props: Object,
  ...children: (ElementInformation | string | number)[]
): ElementInformation {
  if (typeof type == "function") {
    return {
      type,
      props,
      hooks: [],
    };
  }
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
  //topNode指的是container这个点(因为container一定存在dom)
  topNode = {
    type: "div",
    props: { children: [element] },
    dom: null,
    parent: null,
    sibling: null,
    child: {
      ...element,
      dom: null,
      child: null,
      parent: null,
      sibling: null,
    },
  };
  topNode.dom = container;
  topNode.child.parent = topNode;
  currentNode = topNode.child;

  // 根据 ElementInformation 创建 DOM节点
  function createDOM(
    element: HTMLElementInformation | TextElementInformation
  ): HTMLElement | Text {
    if (element.type == "TEXT_ELEMENT") {
      return document.createTextNode(element.props.nodeValue);
    } else {
      let dom: HTMLElement = document.createElement(element.type);
      Object.keys(element.props)
        .filter((key) => key != "children")
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
            if (key === "style" && element.props[key] instanceof Object) {
              Object.keys(element.props[key]).forEach((k) => {
                dom.style[k] = element.props[key][k];
              });
            } else dom.setAttribute(key, element.props[key]);
          }
        });
      return dom;
    }
  }

  // function DFS(element: ElementInformation): HTMLElement | Text {
  //   // debugger;
  //   if (element.type == "TEXT_ELEMENT") {
  //     return createDOM(element);
  //   } else {
  //     // debugger;
  //     let dom = createDOM(element);
  //     if (element.props.children.length > 0)
  //       element.props.children.forEach((child) => {
  //         dom.appendChild(DFS(child));
  //       });
  //     return dom;
  //   }
  // }

  function wookLoop(deadline: IdleDeadline): void {
    /**
     * 创建子元素的fiber节点
     * （利用父元素中children数组信息创建fiber节点，并创建元素之间的parent、child、sibling关系）
     * @param fiber 即将创建子元素fiber的父元素fiber
     */
    function createChildrenFiber(fiber: Fiber): void {
      if (isFunctionElementInformation(fiber)) return;
      if (isTextElementInformation(fiber)) return;
      let isFirstChild: boolean = true;
      let lastChild: Fiber = null;
      fiber.props.children.forEach((child) => {
        let newFiber: Fiber = {
          ...child,
          dom: null,
          child: null,
          parent: fiber,
          sibling: null,
        };
        if (!isFirstChild) {
          lastChild.sibling = newFiber;
          lastChild = newFiber;
        }
        if (isFirstChild) {
          fiber.child = newFiber;
          isFirstChild = false;
          lastChild = newFiber;
        }
      });
    }

    /**
     * 找到下一个fiber节点
     * @param fiber 上一个fiber节点
     * @returns 返回下一个该处理的fiber节点
     */
    function findNextFiber(fiber: Fiber): Fiber {
      // 如果有儿子先访问儿子
      if (fiber.child) {
        return fiber.child;
      }
      // 没有儿子访问兄弟
      else if (fiber.sibling) {
        return fiber.sibling;
      }
      // 没有儿子与兄弟，访问最近的有兄弟的祖先的兄弟
      else {
        let par = fiber;
        while (par.parent && !par.parent.sibling) {
          par = par.parent;
        }
        if (!par.parent) return null;
        return par.parent.sibling;
      }
    }

    function commitRoot(rootFiber: Fiber): void {
      function commitWork(fiber: Fiber): void {
        if (fiber.type == "TEXT_ELEMENT") {
          return;
        }
        if (fiber.child) {
          let par: Fiber = fiber;
          while (!par.dom) {
            par = par.parent;
          }
          if (fiber.child.dom) {
            par.dom.appendChild(fiber.child.dom);
          }
          commitWork(fiber.child);

          let sibling: Fiber = fiber.child.sibling;
          while (sibling != null) {
            if (sibling.dom) {
              par.dom.appendChild(sibling.dom);
            }

            commitWork(sibling);
            sibling = sibling.sibling;
          }
        }
      }
      //commit之前先把原来的子节点删除
      const nodes = container.childNodes;
      for (let i = 0; i < nodes.length; ++i) {
        let node = nodes[i];
        container.removeChild(node);
      }

      commitWork(rootFiber);
    }

    //render main step
    if (deadline.timeRemaining() > 1 && currentNode != null) {
      // 如果是非函数式组件
      if (!isFunctionElementInformation(currentNode)) {
        currentNode.dom = createDOM(currentNode);
        createChildrenFiber(currentNode);
        currentNode = findNextFiber(currentNode);
      }
      // 如果是函数式组件
      else {
        hookIndex = -1;
        const elementInformation = currentNode.type(currentNode.props);
        let newFiber = {
          ...elementInformation,
          dom: null,
          parent: null,
          child: null,
          sibling: null,
        };
        currentNode.child = newFiber;
        newFiber.parent = currentNode;
        currentNode = newFiber;
      }
      if (currentNode == null) {
        commitRoot(topNode);
        // container.appendChild(topNode.dom);
      }
    }
    //递归调用
    requestIdleCallback(wookLoop);
  }
  requestIdleCallback(wookLoop);
}

function useState(initial: any) {
  if (!isFunctionElementInformation(currentNode)) {
    throw new Error("在非函数式节点使用了useState");
  }

  hookIndex += 1;
  let workInProgressFiber = currentNode;
  let index = hookIndex;

  if (workInProgressFiber.hooks.length <= hookIndex) {
    //第一次调用这个setState
    workInProgressFiber.hooks.push({
      state: initial,
      actions: [],
    });
  } else {
    //非第一次调用这个setState
    workInProgressFiber.hooks[hookIndex].actions.forEach((fun) => {
      workInProgressFiber.hooks[hookIndex].state = fun(
        workInProgressFiber.hooks[hookIndex].state
      );
    });
    workInProgressFiber.hooks[hookIndex].actions = [];
  }

  function setState(value: ((state: any) => any) | any) {
    if (value instanceof Function) {
      workInProgressFiber.hooks[index].actions.push(value);
    }
    //传入的是个值
    else {
      workInProgressFiber.hooks[index].actions.push((state: any) => {
        return value;
      });
    }
    //使当前节点指向container，重新渲染
    currentNode = topNode.child;
  }

  return [workInProgressFiber.hooks[hookIndex].state, setState];
}

//-------------------------------------
export const WeiReact = {
  createElement,
  render,
};

export { useState };

// const element = (
//   <div>
//     <h1 class="ccc" style="color:red">
//       憋叫我猪噢！
//     </h1>
//     <h1 class="222" style="color:blue">
//       好的佩奇~
//     </h1>
//     <div style="width:200px;height:200px;background-color:#ddedfb;color:black;">
//       <h2>hhh</h2>
//       textnode
//     </div>
//   </div>
// );

// render(element, document.getElementById("root"));
