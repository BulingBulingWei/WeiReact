import { WeiReact } from "./WeiReact";
import { useState } from "./WeiReact";
// 注意：函数式组件的命名的首字母必须大写

function Wei(props: any) {
  return (
    <div>
      <h1 className="hahaha">凯哥好厉害！</h1>
      <h1 className="iiiiii" style={{ color: "blue", fontSize: "50px" }}>
        *\^_^/*
      </h1>
    </div>
  );
}

function Kai(props: any) {
  return (
    <div>
      <h1 className="hahaha">薇薇也是~</h1>
      <h1 className="iiiiii" style={{ color: "pink", fontSize: "50px" }}>
        *\^3^/*
      </h1>
    </div>
  );
}

function Com(props: any) {
  const [num, setNum] = useState(1);
  return (
    <div>
      <h2
        style={{
          color: "orange",
          fontSize: "50px",
          lineHeight: "50px",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => {
          setNum(num + 1);
        }}
      >
        喜欢值：{num}
      </h2>
      <Wei></Wei>
      <Kai></Kai>
    </div>
  );
}

WeiReact.render(<Com />, document.getElementById("root"));
