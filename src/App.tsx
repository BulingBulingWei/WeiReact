import { WeiReact } from "./WeiReact";
// 注意：函数式组件的命名的首字母必须大写

function Wei(props: any) {
  return (
    <div>
      <h1 className="hahaha">凯哥好厉害！</h1>
      <h1 className="iiiiii" style="color:pink">
        *\^_^/*
      </h1>
    </div>
  );
}

function Kai(props: any) {
  return (
    <div>
      <h1 className="hahaha">薇薇也是~</h1>
      <h1 className="iiiiii" style="color:red">
        *\^3^/*
      </h1>
    </div>
  );
}

function Com(props: any) {
  return (
    <div>
      <Wei />
      <div style="width:100vw;height:200px;background-color:#ddedfb;"></div>
      <Kai />
    </div>
  );
}

WeiReact.render(<Com />, document.getElementById("root"));
